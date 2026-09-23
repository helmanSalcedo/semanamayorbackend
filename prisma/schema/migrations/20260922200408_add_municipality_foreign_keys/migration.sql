-- AddForeignKey
ALTER TABLE "heritage"."festival" ADD CONSTRAINT "festival_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "geo"."municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "heritage"."religious_site" ADD CONSTRAINT "religious_site_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "geo"."municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business"."business_location" ADD CONSTRAINT "business_location_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "geo"."municipality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
