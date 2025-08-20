/*
  Warnings:

  - Added the required column `contactNo` to the `consumers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."consumers" ADD COLUMN     "contactNo" TEXT NOT NULL;
