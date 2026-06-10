-- =====================================================================
--  Cercle — Schéma MySQL 8.0 (MVP)
--  Matérialisation de l'architecture BDD. Moteur InnoDB, utf8mb4.
--  UUID en CHAR(36) (DEFAULT (UUID())). Soft delete via deleted_at.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id               CHAR(36)      NOT NULL DEFAULT (UUID()),
    email            VARCHAR(255)  NOT NULL,
    password_hash    VARCHAR(255)  NOT NULL,                -- Argon2
    display_name     VARCHAR(80)   NOT NULL,
    photo_url        VARCHAR(512)  NULL,                    -- obligatoire applicativement, privée
    birthdate        DATE          NOT NULL,                -- age-gate 18+
    onboarding_intent ENUM('maintain','meet') NOT NULL DEFAULT 'maintain',
    role             ENUM('user','moderator','admin') NOT NULL DEFAULT 'user',
    status           ENUM('active','suspended','banned')   NOT NULL DEFAULT 'active',
    created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at       TIMESTAMP     NULL,                    -- soft delete RGPD
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 2. weekly_prompts  (catalogue des questions douces)
-- ---------------------------------------------------------------------
CREATE TABLE weekly_prompts (
    id         INT          NOT NULL AUTO_INCREMENT,
    text       VARCHAR(255) NOT NULL,
    category   VARCHAR(50)  NOT NULL DEFAULT 'general',
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id),
    KEY idx_prompts_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 3. auth_refresh_tokens  (JWT refresh — access géré côté API)
-- ---------------------------------------------------------------------
CREATE TABLE auth_refresh_tokens (
    id          CHAR(36)     NOT NULL DEFAULT (UUID()),
    user_id     CHAR(36)     NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,                      -- jamais le token en clair
    device_info VARCHAR(255) NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_refresh_user (user_id),
    CONSTRAINT fk_refresh_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 4. password_resets  (reset par email, token à usage unique)
-- ---------------------------------------------------------------------
CREATE TABLE password_resets (
    id         CHAR(36)     NOT NULL DEFAULT (UUID()),
    user_id    CHAR(36)     NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_reset_user (user_id),
    CONSTRAINT fk_reset_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 5. links  (le Cercle — membre inscrit OU contact non inscrit)
-- ---------------------------------------------------------------------
CREATE TABLE links (
    id             CHAR(36)     NOT NULL DEFAULT (UUID()),
    owner_user_id  CHAR(36)     NOT NULL,
    member_user_id CHAR(36)     NULL,                       -- NULL = contact non inscrit
    contact_name   VARCHAR(80)  NOT NULL,
    contact_phone  VARCHAR(30)  NULL,
    status         ENUM('active','pending','removed') NOT NULL DEFAULT 'active',
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_links_owner (owner_user_id, status),
    KEY idx_links_member (member_user_id),
    CONSTRAINT fk_links_owner FOREIGN KEY (owner_user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_links_member FOREIGN KEY (member_user_id)
        REFERENCES users(id) ON DELETE SET NULL             -- le lien survit en contact
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 6. journal_entries  (journal relationnel + sortie question hebdo)
-- ---------------------------------------------------------------------
CREATE TABLE journal_entries (
    id         CHAR(36) NOT NULL DEFAULT (UUID()),
    user_id    CHAR(36) NOT NULL,
    link_id    CHAR(36) NULL,                               -- entrée à propos d'une personne
    prompt_id  INT      NULL,                               -- non NULL = issue de la question hebdo
    type       ENUM('gratitude','memory','reflection') NOT NULL DEFAULT 'reflection',
    content    TEXT     NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    KEY idx_journal_user (user_id, created_at),
    KEY idx_journal_link (link_id),
    CONSTRAINT fk_journal_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_journal_link FOREIGN KEY (link_id)
        REFERENCES links(id) ON DELETE SET NULL,
    CONSTRAINT fk_journal_prompt FOREIGN KEY (prompt_id)
        REFERENCES weekly_prompts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 7. nudges  (relances douces — AUCUN streak, volontairement)
-- ---------------------------------------------------------------------
CREATE TABLE nudges (
    id           CHAR(36) NOT NULL DEFAULT (UUID()),
    user_id      CHAR(36) NOT NULL,
    link_id      CHAR(36) NOT NULL,
    type         ENUM('call','coffee','voice','checkin') NOT NULL,
    source       ENUM('weekly','inactivity','manual')    NOT NULL DEFAULT 'weekly',
    status       ENUM('suggested','acted','dismissed')   NOT NULL DEFAULT 'suggested',
    suggested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_nudges_user (user_id, status),
    CONSTRAINT fk_nudges_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_nudges_link FOREIGN KEY (link_id)
        REFERENCES links(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 8. emotional_states  (privés, auto-expirants)
--    Filtrer en lecture : WHERE expires_at > NOW()
-- ---------------------------------------------------------------------
CREATE TABLE emotional_states (
    id         CHAR(36) NOT NULL DEFAULT (UUID()),
    user_id    CHAR(36) NOT NULL,
    state      ENUM('need_to_talk','socially_tired','available','want_to_see') NOT NULL,
    set_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    KEY idx_states_user (user_id, expires_at),
    CONSTRAINT fk_states_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 9. reports  (signalements — sexual / discriminatory explicites)
-- ---------------------------------------------------------------------
CREATE TABLE reports (
    id               CHAR(36) NOT NULL DEFAULT (UUID()),
    reporter_user_id CHAR(36) NULL,                         -- SET NULL = on garde la preuve
    reported_user_id CHAR(36) NULL,
    reason           ENUM('sexual','discriminatory','harassment','other') NOT NULL,
    content_type     VARCHAR(40)  NOT NULL,                 -- profile | photo | journal | ...
    content_id       CHAR(36)     NULL,
    description      TEXT         NULL,
    status           ENUM('open','reviewing','resolved','dismissed') NOT NULL DEFAULT 'open',
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at      TIMESTAMP    NULL,
    PRIMARY KEY (id),
    KEY idx_reports_status (status),
    KEY idx_reports_reported (reported_user_id),
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_reports_reported FOREIGN KEY (reported_user_id)
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 10. moderation_actions  (sanctions graduées, auto ou humaine)
-- ---------------------------------------------------------------------
CREATE TABLE moderation_actions (
    id             CHAR(36) NOT NULL DEFAULT (UUID()),
    target_user_id CHAR(36) NOT NULL,
    report_id      CHAR(36) NULL,
    moderator_id   CHAR(36) NULL,                           -- NULL si automated = TRUE
    action         ENUM('warning','suspension','ban') NOT NULL,
    automated      BOOLEAN  NOT NULL DEFAULT FALSE,
    reason         TEXT     NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at     TIMESTAMP NULL,                          -- pour les suspensions
    PRIMARY KEY (id),
    KEY idx_modactions_target (target_user_id),
    CONSTRAINT fk_modactions_target FOREIGN KEY (target_user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_modactions_report FOREIGN KEY (report_id)
        REFERENCES reports(id) ON DELETE SET NULL,
    CONSTRAINT fk_modactions_moderator FOREIGN KEY (moderator_id)
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 11. moderation_flags  (sortie de la modération automatique à l'upload)
-- ---------------------------------------------------------------------
CREATE TABLE moderation_flags (
    id             CHAR(36) NOT NULL DEFAULT (UUID()),
    target_user_id CHAR(36) NOT NULL,
    content_type   VARCHAR(40)  NOT NULL,
    content_id     CHAR(36)     NULL,
    classifier     VARCHAR(60)  NOT NULL,                   -- ex: image_nsfw, text_hate
    score          DECIMAL(4,3) NOT NULL,                   -- 0.000 - 1.000
    auto_actioned  BOOLEAN      NOT NULL DEFAULT FALSE,
    flagged_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_flags_target (target_user_id),
    CONSTRAINT fk_flags_target FOREIGN KEY (target_user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------
-- 12. audit_log  (conservé même après suppression — rétention bornée)
-- ---------------------------------------------------------------------
CREATE TABLE audit_log (
    id         CHAR(36)     NOT NULL DEFAULT (UUID()),
    user_id    CHAR(36)     NULL,
    action     VARCHAR(80)  NOT NULL,
    entity     VARCHAR(60)  NULL,
    entity_id  CHAR(36)     NULL,
    ip         VARCHAR(45)  NULL,                           -- IPv4 / IPv6
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_user (user_id, created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
--  TRIGGERS — contrainte « 3 liens actifs max » par owner
-- =====================================================================
DELIMITER $$

CREATE TRIGGER trg_links_max_three_insert
BEFORE INSERT ON links
FOR EACH ROW
BEGIN
    DECLARE active_count INT;
    IF NEW.status = 'active' THEN
        SELECT COUNT(*) INTO active_count
        FROM links
        WHERE owner_user_id = NEW.owner_user_id AND status = 'active';
        IF active_count >= 3 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Limite de 3 liens actifs atteinte';
        END IF;
    END IF;
END$$

-- couvre aussi la réactivation d'un lien (removed/pending -> active)
CREATE TRIGGER trg_links_max_three_update
BEFORE UPDATE ON links
FOR EACH ROW
BEGIN
    DECLARE active_count INT;
    IF NEW.status = 'active' AND OLD.status <> 'active' THEN
        SELECT COUNT(*) INTO active_count
        FROM links
        WHERE owner_user_id = NEW.owner_user_id AND status = 'active';
        IF active_count >= 3 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Limite de 3 liens actifs atteinte';
        END IF;
    END IF;
END$$

DELIMITER ;

-- =====================================================================
--  SEED — questions douces de départ
-- =====================================================================
INSERT INTO weekly_prompts (text, category) VALUES
('Qui t''a fait du bien cette semaine ?',                 'gratitude'),
('À qui penses-tu sans lui avoir parlé récemment ?',      'reconnect'),
('Un moment que tu aimerais ne pas oublier ?',            'memory'),
('Pour quoi te sens-tu reconnaissant aujourd''hui ?',     'gratitude'),
('Qui aimerais-tu revoir bientôt ?',                      'reconnect'),
('Quand t''es-tu senti vraiment écouté dernièrement ?',   'reflection');
