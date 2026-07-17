import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260716123608 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "landing_section_item" add column if not exists "image_position" text check ("image_position" in ('center center', 'center top', 'center bottom', 'left center', 'right center', 'left top', 'right top', 'left bottom', 'right bottom')) not null default 'center center';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "landing_section_item" drop column if exists "image_position";`);
  }

}
