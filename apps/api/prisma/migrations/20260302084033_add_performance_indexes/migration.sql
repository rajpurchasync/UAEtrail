-- CreateIndex
CREATE INDEX "AuditLog_entityType_createdAt_idx" ON "AuditLog"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "Event_tenantId_startAt_idx" ON "Event"("tenantId", "startAt");

-- CreateIndex
CREATE INDEX "Event_status_startAt_idx" ON "Event"("status", "startAt");

-- CreateIndex
CREATE INDEX "Event_locationId_idx" ON "Event"("locationId");

-- CreateIndex
CREATE INDEX "EventRequest_eventId_idx" ON "EventRequest"("eventId");

-- CreateIndex
CREATE INDEX "EventRequest_userId_idx" ON "EventRequest"("userId");

-- CreateIndex
CREATE INDEX "EventRequest_status_idx" ON "EventRequest"("status");

-- CreateIndex
CREATE INDEX "Location_status_activityType_idx" ON "Location"("status", "activityType");

-- CreateIndex
CREATE INDEX "Location_status_featured_createdAt_idx" ON "Location"("status", "featured", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_tenantId_idx" ON "MediaAsset"("tenantId");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "OrganizerApplication_status_idx" ON "OrganizerApplication"("status");

-- CreateIndex
CREATE INDEX "OrganizerApplication_applicantId_idx" ON "OrganizerApplication"("applicantId");

-- CreateIndex
CREATE INDEX "Product_merchantId_idx" ON "Product"("merchantId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");
