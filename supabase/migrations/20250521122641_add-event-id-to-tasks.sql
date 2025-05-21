-- Add event_id column to tasks table
ALTER TABLE tasks ADD COLUMN event_id integer NULL;
-- Optionally add a foreign key constraint if events.id is integer:
ALTER TABLE tasks ADD CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES events(id);
