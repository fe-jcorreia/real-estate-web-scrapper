-- CreateTable
CREATE TABLE "listing" (
    "external_id" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "source_id" VARCHAR(100) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "currency" VARCHAR(10),
    "property_type" VARCHAR(50),
    "transaction_type" VARCHAR(20),
    "area" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "parking_spots" INTEGER,
    "address" VARCHAR(500),
    "neighborhood" VARCHAR(200),
    "city" VARCHAR(200),
    "state" VARCHAR(100),
    "zip_code" VARCHAR(20),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_job" (
    "external_id" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "pages_scraped" INTEGER NOT NULL DEFAULT 0,
    "listings_found" INTEGER NOT NULL DEFAULT 0,
    "listings_created" INTEGER NOT NULL DEFAULT 0,
    "listings_updated" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "error_log" JSONB,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scrape_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_page" (
    "external_id" TEXT NOT NULL,
    "id" SERIAL NOT NULL,
    "job_id" TEXT NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "file_path" VARCHAR(1000) NOT NULL,
    "http_status" INTEGER,
    "page_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listing_external_id_key" ON "listing"("external_id");

-- CreateIndex
CREATE INDEX "listing_city_neighborhood_idx" ON "listing"("city", "neighborhood");

-- CreateIndex
CREATE INDEX "listing_source_idx" ON "listing"("source");

-- CreateIndex
CREATE UNIQUE INDEX "listing_source_source_id_key" ON "listing"("source", "source_id");

-- CreateIndex
CREATE UNIQUE INDEX "scrape_job_external_id_key" ON "scrape_job"("external_id");

-- CreateIndex
CREATE INDEX "scrape_job_source_idx" ON "scrape_job"("source");

-- CreateIndex
CREATE INDEX "scrape_job_status_idx" ON "scrape_job"("status");

-- CreateIndex
CREATE UNIQUE INDEX "raw_page_external_id_key" ON "raw_page"("external_id");

-- CreateIndex
CREATE INDEX "raw_page_job_id_idx" ON "raw_page"("job_id");

-- AddForeignKey
ALTER TABLE "raw_page" ADD CONSTRAINT "raw_page_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "scrape_job"("external_id") ON DELETE RESTRICT ON UPDATE CASCADE;
