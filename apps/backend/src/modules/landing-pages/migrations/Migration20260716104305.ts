import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260716104305 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "landing_section_item" ("id" text not null, "item_type" text check ("item_type" in ('card', 'slide', 'video', 'text', 'custom')) not null default 'card', "title" text null, "subtitle" text null, "description" text null, "desktop_image" text null, "mobile_image" text null, "video_url" text null, "button_text" text null, "button_link" text null, "alignment" text check ("alignment" in ('left', 'center', 'right')) not null default 'center', "display_order" integer not null default 0, "is_visible" boolean not null default true, "metadata" jsonb null, "landing_section_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "landing_section_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_landing_section_item_landing_section_id" ON "landing_section_item" ("landing_section_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_landing_section_item_deleted_at" ON "landing_section_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "landing_section_item" add constraint "landing_section_item_landing_section_id_foreign" foreign key ("landing_section_id") references "landing_section" ("id") on update cascade;`);

    // Copy existing data from landing_section to landing_section_item
    this.addSql(`
      INSERT INTO "landing_section_item" (
        "id", "landing_section_id", "item_type", "title", "subtitle", "description", 
        "desktop_image", "mobile_image", "video_url", "button_text", "button_link", "alignment", "display_order", "is_visible"
      )
      SELECT 
        'item_' || substr(md5(random()::text), 1, 20), "id", 'card', "title", "subtitle", "description", 
        "desktop_image", "mobile_image", "video_url", "button_text", "button_link", "alignment", 0, true
      FROM "landing_section"
    `);

    this.addSql(`alter table if exists "landing_section" drop column if exists "title", drop column if exists "subtitle", drop column if exists "description", drop column if exists "button_text", drop column if exists "button_link", drop column if exists "desktop_image", drop column if exists "mobile_image", drop column if exists "video_url", drop column if exists "alignment";`);

    this.addSql(`alter table if exists "landing_section" add column if not exists "layout_type" text check ("layout_type" in ('hero_slider', 'split_banner', 'editorial_banner', 'product_showcase', 'video_banner', 'newsletter', 'custom')) not null default 'custom', add column if not exists "max_items" integer null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "landing_section_item" cascade;`);

    this.addSql(`alter table if exists "landing_section" drop column if exists "layout_type", drop column if exists "max_items";`);

    this.addSql(`alter table if exists "landing_section" add column if not exists "title" text null, add column if not exists "subtitle" text null, add column if not exists "description" text null, add column if not exists "button_text" text null, add column if not exists "button_link" text null, add column if not exists "desktop_image" text null, add column if not exists "mobile_image" text null, add column if not exists "video_url" text null, add column if not exists "alignment" text check ("alignment" in ('left', 'right', 'center')) not null default 'center';`);
  }

}
