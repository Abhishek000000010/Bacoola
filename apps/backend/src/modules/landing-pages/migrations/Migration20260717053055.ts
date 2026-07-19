import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260717053055 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "landing_section" drop constraint if exists "landing_section_layout_type_check";`);

    this.addSql(`alter table if exists "landing_section" add constraint "landing_section_layout_type_check" check("layout_type" in ('hero_slider', 'hero_banner', 'split_banner', 'editorial_banner', 'product_showcase', 'video_banner', 'newsletter', 'custom'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "landing_section" drop constraint if exists "landing_section_layout_type_check";`);

    this.addSql(`alter table if exists "landing_section" add constraint "landing_section_layout_type_check" check("layout_type" in ('hero_slider', 'split_banner', 'editorial_banner', 'product_showcase', 'video_banner', 'newsletter', 'custom'));`);
  }

}
