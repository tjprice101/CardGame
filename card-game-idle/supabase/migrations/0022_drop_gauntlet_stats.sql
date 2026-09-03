alter table public.profile_stats
  drop column if exists gauntlet_best_depth,
  drop column if exists gauntlet_best_shards,
  drop column if exists gauntlet_runs;