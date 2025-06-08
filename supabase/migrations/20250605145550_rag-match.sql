create or replace function match_essays(
  embedding vector(384),
  match_threshold float
)
returns setof essays
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select *
  from essays
  where (1- essays.embedding <=> embedding) > match_threshold -- Cosine similarity comparison
	order by essays.embedding <=> embedding; -- Ordered by least difference to highest
end;
$$;