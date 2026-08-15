-- Kadra jako jedyny moduł trzymała zdjęcie bezpośrednio w encji, przez co nie miała
-- miniatur i wymagała osobnej ścieżki kasowania plików. Przenosimy ją na media_assets,
-- tak jak zajęcia, eventy i galerię. Przy okazji dochodzi kolejność wyświetlania.

alter table team_members
    add column image_id uuid,
    add column sort_order integer;

-- Przenosimy istniejące zdjęcia do media_assets. stored_file_name to ostatni segment
-- ścieżki, bo relative_path ma postać "kategoria/plik.rozszerzenie".
insert into media_assets (
    id,
    category,
    original_file_name,
    stored_file_name,
    relative_path,
    content_type,
    size_bytes,
    created_at
)
select
    gen_random_uuid(),
    'team',
    substring(photo_path from '[^/]+$'),
    substring(photo_path from '[^/]+$'),
    photo_path,
    photo_content_type,
    photo_size,
    created_at
from team_members;

update team_members member
set image_id = asset.id
from media_assets asset
where asset.relative_path = member.photo_path
  and asset.category = 'team';

-- Kolejność startowa odwzorowuje dotychczasowe sortowanie listy: od najnowszych.
with ordered as (
    select id, row_number() over (order by created_at desc) - 1 as position
    from team_members
)
update team_members member
set sort_order = ordered.position
from ordered
where ordered.id = member.id;

alter table team_members
    alter column image_id set not null,
    alter column sort_order set not null,
    add constraint fk_team_members_image
        foreign key (image_id) references media_assets (id);

alter table team_members
    drop column photo_path,
    drop column photo_content_type,
    drop column photo_size;

create index idx_team_members_sort_order on team_members (sort_order);
