create extension if not exists vector with schema extensions;

create table essays (
  id bigserial primary key,
  title text,
  url text,
  content text,
  embedding vector(384) -- Default for the chosen embedding model
);
