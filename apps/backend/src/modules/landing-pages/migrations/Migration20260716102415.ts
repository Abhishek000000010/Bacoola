import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260716102415 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "landing_section" ("id" text not null, "page" text check ("page" in ('home', 'men', 'women', 'kids', 'teen')) not null, "section_key" text not null, "title" text null, "subtitle" text null, "description" text null, "button_text" text null, "button_link" text null, "desktop_image" text null, "mobile_image" text null, "video_url" text null, "alignment" text check ("alignment" in ('left', 'right', 'center')) not null default 'center', "display_order" integer not null default 0, "is_visible" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "landing_section_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_landing_section_deleted_at" ON "landing_section" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "landing_section" cascade;`);
  }

}
