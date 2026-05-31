-- =============================================================================
-- 충북match — Database Schema (matching2.sql)
-- 기준 PRD: matching2.prd.md v3.0
-- 작성일: 2026-05-31
-- 실행 환경: Supabase SQL Editor
-- 실행 순서: 이 파일을 처음부터 끝까지 순서대로 실행
-- =============================================================================

-- =============================================================================
-- 0. 사전 준비
-- =============================================================================

-- UUID 확장 활성화 (Supabase 기본 활성화되어 있으나 명시)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. 핵심 테이블
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1-1. users (기본 회원 정보)
-- auth.users 와 1:1 연동. 회원가입 트리거로 자동 생성됨.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email         TEXT        UNIQUE NOT NULL,
    nickname      TEXT        UNIQUE NOT NULL,
    student_id    TEXT        NOT NULL,                     -- 학번 (8자리)
    full_name     TEXT        NOT NULL,                     -- 실명
    department    TEXT        NOT NULL DEFAULT '',          -- 소속 학과
    avatar_url    TEXT,
    manner_score  DECIMAL(5,2) NOT NULL DEFAULT 36.5,       -- 매너 온도 (기본 36.5°C)
    role          TEXT        NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'admin')),
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.users IS '충북match 회원 기본 정보';
COMMENT ON COLUMN public.users.manner_score IS '매너 온도: 38초과=열정(빨강), 36.5~38=정상(초록), 미만=주의(파랑)';

-- -----------------------------------------------------------------------------
-- 1-2. sport_profiles (스포츠 매칭용 프로필 — 종목별 1행)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sport_profiles (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sport         TEXT        NOT NULL
                  CHECK (sport IN ('축구', '풋살', '농구', 'e스포츠', '테니스', '기타')),
    skill_level   TEXT        NOT NULL
                  CHECK (skill_level IN ('초급', '중급', '고수')),
    position      TEXT,                                     -- 포지션 (자유 텍스트)
    gender        TEXT        CHECK (gender IN ('male', 'female', 'other')),
    age           INT         CHECK (age BETWEEN 18 AND 40),
    career_years  INT         NOT NULL DEFAULT 0,           -- 운동 경력 (년)
    is_pro        BOOLEAN     NOT NULL DEFAULT FALSE,       -- 선출 여부
    intro         TEXT        CHECK (char_length(intro) <= 300),
    is_visible    BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, sport)                                 -- 종목별 1개 프로필
);

COMMENT ON TABLE  public.sport_profiles IS '종목별 스포츠 실력 프로필 (매칭 개설자에게만 공개)';

-- -----------------------------------------------------------------------------
-- 1-3. contest_profiles (공모전 매칭용 프로필)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contest_profiles (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    department      TEXT        NOT NULL DEFAULT '',
    gender          TEXT        CHECK (gender IN ('male', 'female', 'other')),
    age             INT         CHECK (age BETWEEN 18 AND 40),
    contest_count   INT         NOT NULL DEFAULT 0,         -- 공모전 참여 횟수
    certificates    TEXT[]      NOT NULL DEFAULT '{}',      -- 자격증 목록 (최대 10개)
    fields          TEXT[]      NOT NULL DEFAULT '{}',      -- 관심 분야
    intro           TEXT        CHECK (char_length(intro) <= 300),
    is_visible      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.contest_profiles IS '공모전 팀원 매칭용 프로필';

-- -----------------------------------------------------------------------------
-- 1-4. matches (스포츠 매치 모집 게시글)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    team_name      TEXT        NOT NULL CHECK (char_length(team_name) BETWEEN 2 AND 20),
    sport          TEXT        NOT NULL
                   CHECK (sport IN ('축구', '풋살', '농구', 'e스포츠')),
    match_size     TEXT        NOT NULL
                   CHECK (match_size IN ('1vs1', '3vs3', '5vs5', '11vs11')),
    location       TEXT        NOT NULL CHECK (char_length(location) <= 50),
    description    TEXT        CHECK (char_length(description) BETWEEN 10 AND 500),
    required_level TEXT        NOT NULL
                   CHECK (required_level IN ('초급', '중급', '고수')),
    status         TEXT        NOT NULL DEFAULT '모집중'
                   CHECK (status IN ('모집중', '매치확정', '취소됨')),
    match_datetime TIMESTAMPTZ NOT NULL,                    -- 경기 날짜·시간
    max_players    INT         NOT NULL DEFAULT 0,          -- 주전 모집 인원
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.matches IS '스포츠 매치 모집 게시글';
COMMENT ON COLUMN public.matches.max_players IS '주전 모집 인원. 작성자 1명 자동 포함. displayCount = 신청자수 + 1';

-- 기존 데이터 마이그레이션: max_players 컬럼이 없거나 0인 경우
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS max_players INT DEFAULT 0;
UPDATE public.matches SET max_players = 10 WHERE max_players = 0 OR max_players IS NULL;

-- -----------------------------------------------------------------------------
-- 1-5. match_applications (매치 신청)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_applications (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id     UUID        NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    applicant_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status       TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (match_id, applicant_id)                         -- 중복 신청 방지
);

COMMENT ON TABLE public.match_applications IS '매치 신청 내역. UNIQUE(match_id, applicant_id)로 중복 신청 방지.';

-- -----------------------------------------------------------------------------
-- 1-6. message_rooms (1:1 매치 채팅방)
-- 매치 신청 수락 시 자동 생성
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_rooms (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID        UNIQUE NOT NULL REFERENCES public.match_applications(id) ON DELETE CASCADE,
    participant_1  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_2  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (participant_1 <> participant_2)
);

COMMENT ON TABLE public.message_rooms IS '매치 수락 시 자동 생성되는 1:1 채팅방';

-- -----------------------------------------------------------------------------
-- 1-7. messages (1:1 채팅 메시지)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    UUID        NOT NULL REFERENCES public.message_rooms(id) ON DELETE CASCADE,
    sender_id  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content    TEXT        NOT NULL CHECK (char_length(content) >= 1),
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.messages IS '1:1 매치 채팅 메시지';

-- -----------------------------------------------------------------------------
-- 1-8. reviews (매너 평가 — 별점)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id          UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id    UUID       NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    reviewer_id UUID       NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reviewee_id UUID       NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating      SMALLINT   NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (match_id, reviewer_id),                         -- 한 매치당 1회 평가
    CHECK (reviewer_id <> reviewee_id)
);

COMMENT ON TABLE public.reviews IS '매치 완료 후 상호 매너 평가. 1매치 1회만 가능.';

-- -----------------------------------------------------------------------------
-- 1-9. notifications (알림)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type       TEXT        NOT NULL
               CHECK (type IN (
                   'match_apply',    -- N1: 매치 신청 수신
                   'match_accept',   -- N2: 매치 수락
                   'match_reject',   -- N3: 매치 거절
                   'match_cancel',   -- N8: 매치 취소
                   'new_message',    -- N4: 새 메시지
                   'contest_apply',  -- N5: 공모전 팀원 신청 수신
                   'contest_accept', -- N6: 공모전 팀원 수락
                   'contest_reject'  -- N7: 공모전 팀원 거절
               )),
    message    TEXT        NOT NULL,
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    related_id UUID,                                        -- 관련 match/team ID
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notifications IS '8종 알림 유형 (N1~N8). Supabase Realtime으로 실시간 수신.';

-- -----------------------------------------------------------------------------
-- 1-10. reports (신고)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reported_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason      TEXT        NOT NULL
                CHECK (reason IN ('불쾌한 언행', '허위 정보', '스팸', '기타')),
    detail      TEXT,
    status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'resolved', 'dismissed')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (reporter_id <> reported_id)                      -- 자기 자신 신고 방지
);

COMMENT ON TABLE public.reports IS '유저 신고. 3회 누적 시 자동 비공개 처리.';

-- =============================================================================
-- 2. 공모전 관련 테이블
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2-1. contest_teams (공모전 팀 모집 게시글)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contest_teams (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    contest_id      INT         NOT NULL,                   -- 정적 데이터 contests.ts 의 id
    leader_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    team_name       TEXT        NOT NULL CHECK (char_length(team_name) BETWEEN 1 AND 50),
    description     TEXT        CHECK (char_length(description) >= 10),
    required_roles  TEXT[]      NOT NULL DEFAULT '{}',      -- 필요 역할 목록
    max_size        INT         NOT NULL DEFAULT 4
                    CHECK (max_size BETWEEN 1 AND 5),       -- 최대 팀원 수 (본인 제외)
    current_count   INT         NOT NULL DEFAULT 0
                    CHECK (current_count >= 0),             -- 현재 수락된 신청자 수
    is_recruiting   BOOLEAN     NOT NULL DEFAULT TRUE,
    status          TEXT        NOT NULL DEFAULT '모집중'
                    CHECK (status IN ('모집중', '마감')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.contest_teams IS '공모전 팀 모집 게시글. 생성 시 contest_chat_rooms 자동 생성.';
COMMENT ON COLUMN public.contest_teams.current_count IS '수락된 팀원 수. max_size 도달 시 status=마감, 나머지 pending 자동 거절.';

-- -----------------------------------------------------------------------------
-- 2-2. contest_team_applications (공모전 팀 참여 신청)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contest_team_applications (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id      UUID        NOT NULL REFERENCES public.contest_teams(id) ON DELETE CASCADE,
    applicant_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message      TEXT        CHECK (char_length(message) <= 500),
    status       TEXT        NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (team_id, applicant_id)                          -- 중복 신청 방지
);

COMMENT ON TABLE public.contest_team_applications IS '공모전 팀 참여 신청. UNIQUE(team_id, applicant_id)로 중복 신청 방지.';

-- -----------------------------------------------------------------------------
-- 2-3. contest_chat_rooms (공모전 팀 그룹 채팅방)
-- contest_teams 생성 시 트리거로 자동 생성
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contest_chat_rooms (
    id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID        UNIQUE NOT NULL REFERENCES public.contest_teams(id) ON DELETE CASCADE,
    name    TEXT        NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.contest_chat_rooms IS '공모전 팀 그룹 채팅방. contest_teams 생성 트리거로 자동 생성.';

-- -----------------------------------------------------------------------------
-- 2-4. contest_chat_members (그룹 채팅방 멤버)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contest_chat_members (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id   UUID        NOT NULL REFERENCES public.contest_chat_rooms(id) ON DELETE CASCADE,
    user_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (room_id, user_id)
);

COMMENT ON TABLE public.contest_chat_members IS '그룹 채팅방 멤버. 팀 리더는 팀 생성 시 자동 추가.';

-- -----------------------------------------------------------------------------
-- 2-5. contest_chat_messages (그룹 채팅 메시지)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contest_chat_messages (
    id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id   UUID        NOT NULL REFERENCES public.contest_chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content   TEXT        NOT NULL CHECK (char_length(content) >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.contest_chat_messages IS '공모전 팀 그룹 채팅 메시지';

-- =============================================================================
-- 3. 크롤링 데이터 테이블
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3-1. sports_reservations (학내 체육시설 예약 현황 — 크롤러 적재)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sports_reservations (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    facility         TEXT        NOT NULL
                     CHECK (facility IN (
                         'futsal_a', 'futsal_b',
                         'basketball_a', 'basketball_b',
                         'tennis_a', 'tennis_b', 'tennis_c', 'tennis_d', 'tennis_e',
                         'small_field', 'main_field'
                     )),
    reservation_date DATE        NOT NULL,
    start_time       TIME        NOT NULL,
    end_time         TIME        NOT NULL,
    status           TEXT        NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available', 'reserved', 'closed')),
    last_crawled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (facility, reservation_date, start_time)
);

COMMENT ON TABLE public.sports_reservations IS '충북대 학내 체육시설 예약 현황 (크롤러 자동 적재, 매 1시간 갱신)';

-- -----------------------------------------------------------------------------
-- 3-2. external_contests (외부 공모전 — 크롤러 적재)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.external_contests (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT        NOT NULL,
    url             TEXT        UNIQUE NOT NULL,            -- 중복 방지 키
    category        TEXT,                                   -- marketing/video/design 등
    organizer       TEXT,
    deadline        DATE        NOT NULL,
    source          TEXT        CHECK (source IN ('contestkorea', 'wevity', 'linkareer')),
    description     TEXT,
    thumbnail_url   TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    last_crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.external_contests IS '외부 사이트 크롤링 공모전 데이터 (매일 00:00 KST 갱신)';

-- =============================================================================
-- 4. 인덱스 (성능 최적화)
-- =============================================================================

-- users
CREATE INDEX IF NOT EXISTS idx_users_nickname    ON public.users (nickname);
CREATE INDEX IF NOT EXISTS idx_users_is_active   ON public.users (is_active);

-- sport_profiles
CREATE INDEX IF NOT EXISTS idx_sport_profiles_user_sport ON public.sport_profiles (user_id, sport);
CREATE INDEX IF NOT EXISTS idx_sport_profiles_is_visible ON public.sport_profiles (is_visible);

-- matches
CREATE INDEX IF NOT EXISTS idx_matches_author_id      ON public.matches (author_id);
CREATE INDEX IF NOT EXISTS idx_matches_sport          ON public.matches (sport);
CREATE INDEX IF NOT EXISTS idx_matches_status         ON public.matches (status);
CREATE INDEX IF NOT EXISTS idx_matches_match_datetime ON public.matches (match_datetime);
CREATE INDEX IF NOT EXISTS idx_matches_created_at     ON public.matches (created_at DESC);

-- match_applications
CREATE INDEX IF NOT EXISTS idx_match_applications_match_id     ON public.match_applications (match_id);
CREATE INDEX IF NOT EXISTS idx_match_applications_applicant_id ON public.match_applications (applicant_id);
CREATE INDEX IF NOT EXISTS idx_match_applications_status       ON public.match_applications (status);

-- message_rooms
CREATE INDEX IF NOT EXISTS idx_message_rooms_participant_1 ON public.message_rooms (participant_1);
CREATE INDEX IF NOT EXISTS idx_message_rooms_participant_2 ON public.message_rooms (participant_2);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_room_id    ON public.messages (room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- contest_teams
CREATE INDEX IF NOT EXISTS idx_contest_teams_contest_id  ON public.contest_teams (contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_teams_leader_id   ON public.contest_teams (leader_id);
CREATE INDEX IF NOT EXISTS idx_contest_teams_status      ON public.contest_teams (status);

-- contest_team_applications
CREATE INDEX IF NOT EXISTS idx_contest_team_applications_team_id      ON public.contest_team_applications (team_id);
CREATE INDEX IF NOT EXISTS idx_contest_team_applications_applicant_id ON public.contest_team_applications (applicant_id);
CREATE INDEX IF NOT EXISTS idx_contest_team_applications_status       ON public.contest_team_applications (status);

-- contest_chat_members
CREATE INDEX IF NOT EXISTS idx_contest_chat_members_room_id  ON public.contest_chat_members (room_id);
CREATE INDEX IF NOT EXISTS idx_contest_chat_members_user_id  ON public.contest_chat_members (user_id);

-- contest_chat_messages
CREATE INDEX IF NOT EXISTS idx_contest_chat_messages_room_id    ON public.contest_chat_messages (room_id);
CREATE INDEX IF NOT EXISTS idx_contest_chat_messages_created_at ON public.contest_chat_messages (created_at DESC);

-- external_contests
CREATE INDEX IF NOT EXISTS idx_external_contests_deadline   ON public.external_contests (deadline);
CREATE INDEX IF NOT EXISTS idx_external_contests_is_active  ON public.external_contests (is_active);
CREATE INDEX IF NOT EXISTS idx_external_contests_category   ON public.external_contests (category);

-- sports_reservations
CREATE INDEX IF NOT EXISTS idx_sports_reservations_facility_date ON public.sports_reservations (facility, reservation_date);

-- =============================================================================
-- 5. 함수 (Functions)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 5-1. updated_at 자동 갱신 함수
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 등록
CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_match_applications_updated_at
    BEFORE UPDATE ON public.match_applications
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_sport_profiles_updated_at
    BEFORE UPDATE ON public.sport_profiles
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_contest_profiles_updated_at
    BEFORE UPDATE ON public.contest_profiles
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_contest_team_applications_updated_at
    BEFORE UPDATE ON public.contest_team_applications
    FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 5-2. auth.users INSERT → public.users 자동 생성 트리거
-- 회원가입 시 이 트리거가 public.users 레코드를 생성함
-- metadata: { nickname, student_id, full_name, department }
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        nickname,
        student_id,
        full_name,
        department,
        manner_score,
        role,
        is_active
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nickname', '익명'),
        COALESCE(NEW.raw_user_meta_data->>'student_id', ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'department', ''),
        36.5,
        'user',
        TRUE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 트리거 등록
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.fn_handle_new_user();

-- -----------------------------------------------------------------------------
-- 5-3. 매너 온도 자동 업데이트 (reviews INSERT 시)
-- 별점 평균으로 reviewee의 manner_score 갱신
-- 기준: 별점 1→34.0, 2→35.5, 3→36.5, 4→38.0, 5→40.0 등의 선형 매핑
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_update_manner_score()
RETURNS TRIGGER AS $$
DECLARE
    v_avg DECIMAL(5,2);
BEGIN
    SELECT
        -- 별점 범위(1~5)를 매너 온도 범위(34.0~40.0)로 선형 매핑
        ROUND(34.0 + (AVG(rating) - 1.0) * (40.0 - 34.0) / (5.0 - 1.0), 2)
    INTO v_avg
    FROM public.reviews
    WHERE reviewee_id = NEW.reviewee_id;

    UPDATE public.users
    SET manner_score = v_avg,
        updated_at   = NOW()
    WHERE id = NEW.reviewee_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_update_manner_score
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_manner_score();

-- -----------------------------------------------------------------------------
-- 5-4. 공모전 팀 생성 → 채팅방 + 팀장 자동 추가
-- contest_teams INSERT 시 contest_chat_rooms & contest_chat_members 자동 생성
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_create_contest_chat_room()
RETURNS TRIGGER AS $$
DECLARE
    v_room_id UUID;
BEGIN
    INSERT INTO public.contest_chat_rooms (team_id, name)
    VALUES (NEW.id, NEW.team_name)
    RETURNING id INTO v_room_id;

    INSERT INTO public.contest_chat_members (room_id, user_id)
    VALUES (v_room_id, NEW.leader_id)
    ON CONFLICT (room_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_create_contest_chat_room
    AFTER INSERT ON public.contest_teams
    FOR EACH ROW EXECUTE FUNCTION public.fn_create_contest_chat_room();

-- -----------------------------------------------------------------------------
-- 5-5. 매치 수락 → 1:1 채팅방 자동 생성
-- match_applications.status → 'accepted' 시 message_rooms 자동 생성
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_create_message_room_on_accept()
RETURNS TRIGGER AS $$
DECLARE
    v_author_id UUID;
BEGIN
    IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
        SELECT author_id INTO v_author_id
        FROM public.matches
        WHERE id = NEW.match_id;

        INSERT INTO public.message_rooms (application_id, participant_1, participant_2)
        VALUES (NEW.id, v_author_id, NEW.applicant_id)
        ON CONFLICT (application_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_create_message_room_on_accept
    AFTER UPDATE OF status ON public.match_applications
    FOR EACH ROW EXECUTE FUNCTION public.fn_create_message_room_on_accept();

-- -----------------------------------------------------------------------------
-- 5-6. 공모전 신청 수락 → 채팅방 멤버 추가 + 팀 자동 마감
-- contest_team_applications.status → 'accepted' 시 처리
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_handle_contest_application_accept()
RETURNS TRIGGER AS $$
DECLARE
    v_room_id     UUID;
    v_max_size    INT;
    v_new_count   INT;
BEGIN
    IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
        -- 채팅방 멤버에 신청자 추가
        SELECT id INTO v_room_id
        FROM public.contest_chat_rooms
        WHERE team_id = NEW.team_id;

        IF v_room_id IS NOT NULL THEN
            INSERT INTO public.contest_chat_members (room_id, user_id)
            VALUES (v_room_id, NEW.applicant_id)
            ON CONFLICT (room_id, user_id) DO NOTHING;
        END IF;

        -- current_count 증가
        UPDATE public.contest_teams
        SET current_count = current_count + 1
        WHERE id = NEW.team_id
        RETURNING current_count, max_size INTO v_new_count, v_max_size;

        -- 팀 정원 충족 시 자동 마감 + 나머지 pending 자동 거절
        IF v_new_count >= v_max_size THEN
            UPDATE public.contest_teams
            SET status = '마감', is_recruiting = FALSE
            WHERE id = NEW.team_id;

            UPDATE public.contest_team_applications
            SET status = 'rejected', updated_at = NOW()
            WHERE team_id = NEW.team_id
              AND status = 'pending'
              AND id <> NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_handle_contest_application_accept
    AFTER UPDATE OF status ON public.contest_team_applications
    FOR EACH ROW EXECUTE FUNCTION public.fn_handle_contest_application_accept();

-- -----------------------------------------------------------------------------
-- 5-7. 신고 누적 3회 → 유저 자동 비공개
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_auto_deactivate_on_reports()
RETURNS TRIGGER AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.reports
    WHERE reported_id = NEW.reported_id
      AND status = 'pending';

    IF v_count >= 3 THEN
        UPDATE public.users
        SET is_active = FALSE, updated_at = NOW()
        WHERE id = NEW.reported_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_auto_deactivate_on_reports
    AFTER INSERT ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.fn_auto_deactivate_on_reports();

-- =============================================================================
-- 6. Row Level Security (RLS) 정책
-- =============================================================================

-- =============================================================================
-- 6-1. users
-- =============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 인증된 모든 유저가 활성 유저 프로필 조회 가능
CREATE POLICY "users_select_authenticated"
    ON public.users FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- 관리자는 모든 유저 조회 가능
CREATE POLICY "users_select_admin"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- 본인 레코드만 수정
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- =============================================================================
-- 6-2. sport_profiles
-- =============================================================================
ALTER TABLE public.sport_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sport_profiles_select_visible"
    ON public.sport_profiles FOR SELECT
    TO authenticated
    USING (is_visible = TRUE);

CREATE POLICY "sport_profiles_select_own"
    ON public.sport_profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "sport_profiles_insert_own"
    ON public.sport_profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "sport_profiles_update_own"
    ON public.sport_profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "sport_profiles_delete_own"
    ON public.sport_profiles FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =============================================================================
-- 6-3. contest_profiles
-- =============================================================================
ALTER TABLE public.contest_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contest_profiles_select_visible"
    ON public.contest_profiles FOR SELECT
    TO authenticated
    USING (is_visible = TRUE);

CREATE POLICY "contest_profiles_select_own"
    ON public.contest_profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "contest_profiles_insert_own"
    ON public.contest_profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "contest_profiles_update_own"
    ON public.contest_profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "contest_profiles_delete_own"
    ON public.contest_profiles FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =============================================================================
-- 6-4. matches
-- =============================================================================
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_select_authenticated"
    ON public.matches FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "matches_insert_authenticated"
    ON public.matches FOR INSERT
    TO authenticated
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "matches_update_own"
    ON public.matches FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

CREATE POLICY "matches_delete_own"
    ON public.matches FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());

-- =============================================================================
-- 6-5. match_applications
-- =============================================================================
ALTER TABLE public.match_applications ENABLE ROW LEVEL SECURITY;

-- 신청자 본인 또는 매치 개설자가 조회 가능
CREATE POLICY "match_applications_select"
    ON public.match_applications FOR SELECT
    TO authenticated
    USING (
        applicant_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id = match_id AND m.author_id = auth.uid()
        )
    );

-- 인증 유저가 신청 (본인 게시글 신청 방지는 API에서 처리)
CREATE POLICY "match_applications_insert"
    ON public.match_applications FOR INSERT
    TO authenticated
    WITH CHECK (applicant_id = auth.uid());

-- 매치 개설자가 수락/거절 업데이트
CREATE POLICY "match_applications_update_author"
    ON public.match_applications FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id = match_id AND m.author_id = auth.uid()
        )
    );

-- 신청자 본인이 취소 (DELETE)
CREATE POLICY "match_applications_delete_own"
    ON public.match_applications FOR DELETE
    TO authenticated
    USING (applicant_id = auth.uid());

-- =============================================================================
-- 6-6. message_rooms
-- =============================================================================
ALTER TABLE public.message_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_rooms_select_participant"
    ON public.message_rooms FOR SELECT
    TO authenticated
    USING (
        participant_1 = auth.uid()
        OR participant_2 = auth.uid()
    );

-- 채팅방 삭제: 참여자만 가능
CREATE POLICY "message_rooms_delete_participant"
    ON public.message_rooms FOR DELETE
    TO authenticated
    USING (
        participant_1 = auth.uid()
        OR participant_2 = auth.uid()
    );

-- =============================================================================
-- 6-7. messages
-- =============================================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.message_rooms mr
            WHERE mr.id = room_id
              AND (mr.participant_1 = auth.uid() OR mr.participant_2 = auth.uid())
        )
    );

CREATE POLICY "messages_insert_participant"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.message_rooms mr
            WHERE mr.id = room_id
              AND (mr.participant_1 = auth.uid() OR mr.participant_2 = auth.uid())
        )
    );

-- 읽음 처리 업데이트
CREATE POLICY "messages_update_read"
    ON public.messages FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.message_rooms mr
            WHERE mr.id = room_id
              AND (mr.participant_1 = auth.uid() OR mr.participant_2 = auth.uid())
        )
    );

-- =============================================================================
-- 6-8. reviews
-- =============================================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_authenticated"
    ON public.reviews FOR SELECT
    TO authenticated
    USING (TRUE);

-- 매치 참여자만 평가 작성 가능
CREATE POLICY "reviews_insert_participant"
    ON public.reviews FOR INSERT
    TO authenticated
    WITH CHECK (
        reviewer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.match_applications ma
            WHERE ma.match_id = reviews.match_id
              AND ma.status = 'accepted'
              AND (
                  ma.applicant_id = auth.uid()
                  OR EXISTS (
                      SELECT 1 FROM public.matches m
                      WHERE m.id = ma.match_id AND m.author_id = auth.uid()
                  )
              )
        )
    );

-- =============================================================================
-- 6-9. notifications
-- =============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 읽음 처리
CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 서버(service_role)만 INSERT — 클라이언트 직접 삽입 차단
-- (API Route에서 service_role 클라이언트로 삽입)

-- =============================================================================
-- 6-10. reports
-- =============================================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 인증 유저가 신고 접수
CREATE POLICY "reports_insert_authenticated"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (reporter_id = auth.uid());

-- 관리자만 신고 내역 조회·처리
CREATE POLICY "reports_select_admin"
    ON public.reports FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

CREATE POLICY "reports_update_admin"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- =============================================================================
-- 6-11. contest_teams
-- =============================================================================
ALTER TABLE public.contest_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contest_teams_select_authenticated"
    ON public.contest_teams FOR SELECT
    TO authenticated
    USING (TRUE);

CREATE POLICY "contest_teams_insert_authenticated"
    ON public.contest_teams FOR INSERT
    TO authenticated
    WITH CHECK (leader_id = auth.uid());

CREATE POLICY "contest_teams_update_leader"
    ON public.contest_teams FOR UPDATE
    TO authenticated
    USING (leader_id = auth.uid())
    WITH CHECK (leader_id = auth.uid());

CREATE POLICY "contest_teams_delete_leader"
    ON public.contest_teams FOR DELETE
    TO authenticated
    USING (leader_id = auth.uid());

-- =============================================================================
-- 6-12. contest_team_applications
-- =============================================================================
ALTER TABLE public.contest_team_applications ENABLE ROW LEVEL SECURITY;

-- 신청자 본인 또는 팀 리더가 조회
CREATE POLICY "contest_team_applications_select"
    ON public.contest_team_applications FOR SELECT
    TO authenticated
    USING (
        applicant_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.contest_teams ct
            WHERE ct.id = team_id AND ct.leader_id = auth.uid()
        )
    );

CREATE POLICY "contest_team_applications_insert"
    ON public.contest_team_applications FOR INSERT
    TO authenticated
    WITH CHECK (applicant_id = auth.uid());

-- 팀 리더가 수락/거절 처리
CREATE POLICY "contest_team_applications_update_leader"
    ON public.contest_team_applications FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contest_teams ct
            WHERE ct.id = team_id AND ct.leader_id = auth.uid()
        )
    );

-- 신청자 본인 취소
CREATE POLICY "contest_team_applications_delete_own"
    ON public.contest_team_applications FOR DELETE
    TO authenticated
    USING (applicant_id = auth.uid());

-- =============================================================================
-- 6-13. contest_chat_rooms
-- =============================================================================
ALTER TABLE public.contest_chat_rooms ENABLE ROW LEVEL SECURITY;

-- 채팅방 멤버만 조회 가능
CREATE POLICY "contest_chat_rooms_select_member"
    ON public.contest_chat_rooms FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contest_chat_members ccm
            WHERE ccm.room_id = id AND ccm.user_id = auth.uid()
        )
    );

-- =============================================================================
-- 6-14. contest_chat_members
-- =============================================================================
ALTER TABLE public.contest_chat_members ENABLE ROW LEVEL SECURITY;

-- 같은 채팅방 멤버끼리 조회 가능
CREATE POLICY "contest_chat_members_select_member"
    ON public.contest_chat_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contest_chat_members ccm2
            WHERE ccm2.room_id = room_id AND ccm2.user_id = auth.uid()
        )
    );

-- 팀 리더만 멤버 추가 (초대)
CREATE POLICY "contest_chat_members_insert_leader"
    ON public.contest_chat_members FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contest_chat_rooms ccr
            JOIN public.contest_teams ct ON ct.id = ccr.team_id
            WHERE ccr.id = room_id AND ct.leader_id = auth.uid()
        )
    );

-- 본인만 채팅방 나가기
CREATE POLICY "contest_chat_members_delete_own"
    ON public.contest_chat_members FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =============================================================================
-- 6-15. contest_chat_messages
-- =============================================================================
ALTER TABLE public.contest_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contest_chat_messages_select_member"
    ON public.contest_chat_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.contest_chat_members ccm
            WHERE ccm.room_id = room_id AND ccm.user_id = auth.uid()
        )
    );

CREATE POLICY "contest_chat_messages_insert_member"
    ON public.contest_chat_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.contest_chat_members ccm
            WHERE ccm.room_id = room_id AND ccm.user_id = auth.uid()
        )
    );

-- =============================================================================
-- 6-16. sports_reservations
-- =============================================================================
ALTER TABLE public.sports_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sports_reservations_select_authenticated"
    ON public.sports_reservations FOR SELECT
    TO authenticated
    USING (TRUE);

-- INSERT/UPDATE/DELETE: service_role 전용 (크롤러)

-- =============================================================================
-- 6-17. external_contests
-- =============================================================================
ALTER TABLE public.external_contests ENABLE ROW LEVEL SECURITY;

-- 비인증 사용자도 조회 가능
CREATE POLICY "external_contests_select_public"
    ON public.external_contests FOR SELECT
    TO anon, authenticated
    USING (is_active = TRUE);

-- INSERT/UPDATE/DELETE: service_role 전용 (크롤러)

-- =============================================================================
-- 7. Supabase Realtime 활성화
-- =============================================================================

-- Realtime 퍼블리케이션에 테이블 추가
-- (Supabase 대시보드 Database → Replication → supabase_realtime 에서도 설정 가능)

ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_team_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contest_chat_messages;

-- =============================================================================
-- 8. 유틸리티 뷰 (View)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 8-1. v_match_list: 매치 목록 조회용 (신청자 수 집계 포함)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_match_list AS
SELECT
    m.id,
    m.author_id,
    u.nickname                                             AS author_nickname,
    u.manner_score                                         AS author_manner_score,
    m.team_name,
    m.sport,
    m.match_size,
    m.location,
    m.description,
    m.required_level,
    m.status,
    m.match_datetime,
    m.max_players,
    m.created_at,
    -- 수락된 신청자 수 (pending 포함)
    COUNT(ma.id) FILTER (WHERE ma.status = 'pending')      AS pending_count,
    COUNT(ma.id) FILTER (WHERE ma.status = 'accepted')     AS accepted_count,
    -- displayCount = 수락/신청 총원 + 1(작성자)
    COUNT(ma.id) FILTER (WHERE ma.status IN ('pending','accepted')) + 1 AS display_count
FROM public.matches m
JOIN public.users   u  ON u.id = m.author_id
LEFT JOIN public.match_applications ma ON ma.match_id = m.id
WHERE m.match_datetime > NOW()                             -- 만료 매치 자동 제외
GROUP BY m.id, u.nickname, u.manner_score;

-- -----------------------------------------------------------------------------
-- 8-2. v_applicant_detail: 신청자 상세 정보 (개설자 전용)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_applicant_detail AS
SELECT
    ma.id                   AS application_id,
    ma.match_id,
    ma.status,
    ma.created_at           AS applied_at,
    u.id                    AS applicant_id,
    u.nickname,
    u.manner_score,
    -- 해당 종목 스포츠 프로필 (매치 종목과 조인)
    sp.sport,
    sp.skill_level,
    sp.position,
    sp.career_years,
    sp.is_pro,
    CASE WHEN sp.id IS NULL THEN TRUE ELSE FALSE END AS is_skill_unregistered
FROM public.match_applications ma
JOIN public.users u ON u.id = ma.applicant_id
JOIN public.matches m ON m.id = ma.match_id
LEFT JOIN public.sport_profiles sp
    ON sp.user_id = ma.applicant_id AND sp.sport = m.sport;

-- -----------------------------------------------------------------------------
-- 8-3. v_contest_team_list: 공모전 팀 목록 (남은 자리 포함)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_contest_team_list AS
SELECT
    ct.id,
    ct.contest_id,
    ct.leader_id,
    u.nickname              AS leader_nickname,
    u.manner_score          AS leader_manner_score,
    ct.team_name,
    ct.description,
    ct.required_roles,
    ct.max_size,
    ct.current_count,
    ct.max_size - ct.current_count AS remaining_slots,
    ct.is_recruiting,
    ct.status,
    ct.created_at,
    COUNT(cta.id) FILTER (WHERE cta.status = 'pending') AS pending_applications
FROM public.contest_teams ct
JOIN public.users u ON u.id = ct.leader_id
LEFT JOIN public.contest_team_applications cta ON cta.team_id = ct.id
GROUP BY ct.id, u.nickname, u.manner_score;

-- =============================================================================
-- 9. 헬퍼 함수 (API Route에서 활용)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 9-1. 만료 매치 일괄 삭제 (Cron Job용)
-- /api/cron/cleanup-matches 에서 SECURITY DEFINER 호출
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_cleanup_expired_matches()
RETURNS INT AS $$
DECLARE
    v_deleted INT;
BEGIN
    DELETE FROM public.matches
    WHERE match_datetime < NOW()
    RETURNING *;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 9-2. 만료 외부 공모전 삭제 (Cron Job용)
-- deadline + 1일 < now() 인 레코드 삭제
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_cleanup_expired_external_contests()
RETURNS INT AS $$
DECLARE
    v_deleted INT;
BEGIN
    DELETE FROM public.external_contests
    WHERE deadline < CURRENT_DATE - INTERVAL '1 day';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 9-3. 닉네임 중복 확인
-- /api/auth/check-nickname 에서 호출
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_is_nickname_available(p_nickname TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.users WHERE nickname = p_nickname
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 10. 데이터 검증 제약 추가 (운영 안정성)
-- =============================================================================

-- 매치 인원-종목 연관 규칙: DB 제약으로 2차 방어
-- (1차 방어는 API Route에서 처리)
ALTER TABLE public.matches
    ADD CONSTRAINT chk_match_sport_size CHECK (
        (sport = '축구'    AND match_size IN ('5vs5', '11vs11'))
     OR (sport = '풋살'    AND match_size IN ('3vs3', '5vs5'))
     OR (sport = '농구'    AND match_size IN ('3vs3', '5vs5'))
     OR (sport = 'e스포츠' AND match_size IN ('1vs1', '3vs3', '5vs5'))
    );

-- 자기 자신에게 알림 발송 방지 (시스템 알림 제외 — related_id 활용)
-- (API에서 처리, DB 제약 없음)

-- =============================================================================
-- 11. 초기 데이터 / 시드 (선택)
-- =============================================================================

-- 관리자 계정은 Supabase Auth에서 직접 생성 후 아래 쿼리로 role 변경:
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com';

-- =============================================================================
-- 완료 확인 쿼리
-- =============================================================================
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
