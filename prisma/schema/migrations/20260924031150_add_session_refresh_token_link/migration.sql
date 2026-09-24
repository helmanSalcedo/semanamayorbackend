-- AlterTable
ALTER TABLE "auth"."refresh_token" ADD COLUMN     "session_id" UUID;

-- CreateIndex
CREATE INDEX "refresh_token_session_id_idx" ON "auth"."refresh_token"("session_id");

-- AddForeignKey
ALTER TABLE "auth"."refresh_token" ADD CONSTRAINT "refresh_token_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
