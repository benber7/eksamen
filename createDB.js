const db = require("better-sqlite3")("")


db.exec(`-- Creator:       MySQL Workbench 8.0.27/ExportSQLite Plugin 0.1.0
-- Author:        simie
-- Caption:       New Model
-- Project:       Name of the project
-- Changed:       2023-05-10 14:21
-- Created:       2023-05-10 10:35
PRAGMA foreign_keys = OFF;

-- Schema: ProveEksamen
ATTACH "ProveEksamen.db" AS "ProveEksamen";
BEGIN;
CREATE TABLE "ProveEksamen"."Klasse"(
  "id" INTEGER PRIMARY KEY NOT NULL,
  "navn" VARCHAR(45) NOT NULL,
  "kontaktlærer" INTEGER NOT NULL
);
CREATE TABLE "ProveEksamen"."Person"(
  "id" INTEGER PRIMARY KEY NOT NULL,
  "rolle" VARCHAR(45) NOT NULL,
  "Fornavn" VARCHAR(45) NOT NULL,
  "Etternavn" VARCHAR(45) NOT NULL,
  "Epost" VARCHAR(45) NOT NULL,
  "tlf" VARCHAR(45) NOT NULL,
  "Personnummer" INTEGER NOT NULL,
  "Klasse_id" INTEGER,
  "PassordHash" VARCHAR(45) NOT NULL,
  CONSTRAINT "fk_User_Klasse"
    FOREIGN KEY("Klasse_id")
    REFERENCES "Klasse"("id")
);
CREATE INDEX "ProveEksamen"."Person.fk_User_Klasse_idx" ON "Person" ("Klasse_id");
COMMIT;


`)