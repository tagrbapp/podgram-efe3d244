-- إضافة سياسات RLS لإدارة الفئات من قبل المشرفين

-- السماح للمشرفين بإضافة فئات
CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- السماح للمشرفين بتحديث الفئات
CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- السماح للمشرفين بحذف الفئات
CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));