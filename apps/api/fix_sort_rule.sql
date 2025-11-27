UPDATE ad_type 
SET sort_rule = '{"priority":3,"field":"price","order":"desc","secondField":"created_at","secondOrder":"desc"}' 
WHERE type_code = 'effect';
