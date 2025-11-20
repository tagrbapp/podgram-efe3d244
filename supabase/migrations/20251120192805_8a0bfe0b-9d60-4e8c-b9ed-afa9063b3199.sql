-- حذف السياسة القديمة التي تعتمد على الإعلانات
DROP POLICY IF EXISTS "Listing owners can create auctions" ON auctions;

-- إنشاء سياسة جديدة للسماح بإنشاء المزادات بناءً على user_id
CREATE POLICY "Users can create their own auctions"
ON auctions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- تحديث سياسة التحديث للسماح للمستخدمين بتحديث مزاداتهم
DROP POLICY IF EXISTS "Listing owners can update their auctions" ON auctions;

CREATE POLICY "Users can update their own auctions"
ON auctions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- السماح للجميع بمشاهدة المزادات النشطة (هذه موجودة لكن نتأكد)
DROP POLICY IF EXISTS "Anyone can view active auctions" ON auctions;

CREATE POLICY "Anyone can view active auctions"
ON auctions
FOR SELECT
USING ((status = 'active') OR (status = 'ended'));