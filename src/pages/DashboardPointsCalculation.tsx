import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calculator, Search, User, Plus, Minus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  level: number;
}

const DashboardPointsCalculation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<"add" | "subtract">("add");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { user } = await getSession();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "moderator"]);

      if (!roles || roles.length === 0) {
        navigate("/dashboard");
        toast.error("غير مصرح لك بالوصول لهذه الصفحة");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .ilike("full_name", `%${searchQuery}%`)
      .limit(10);

    if (error) {
      toast.error("فشل البحث عن المستخدمين");
      return;
    }

    const usersWithPoints = await Promise.all(
      (data || []).map(async (user) => {
        const { data: pointsData } = await supabase
          .from("user_points")
          .select("total_points, level")
          .eq("user_id", user.id)
          .single();

        return {
          ...user,
          total_points: pointsData?.total_points || 0,
          level: pointsData?.level || 1,
        };
      })
    );

    setSearchResults(usersWithPoints);
  };

  const handleCalculatePoints = async () => {
    if (!selectedUser) {
      toast.error("يرجى اختيار مستخدم");
      return;
    }

    if (!points || parseInt(points) <= 0) {
      toast.error("يرجى إدخال عدد نقاط صحيح");
      return;
    }

    if (!reason.trim()) {
      toast.error("يرجى إدخال سبب التغيير");
      return;
    }

    setProcessing(true);

    try {
      const pointsValue = action === "add" ? parseInt(points) : -parseInt(points);

      const { error } = await supabase.rpc("add_points", {
        _user_id: selectedUser.id,
        _points: pointsValue,
        _reason: reason,
      });

      if (error) throw error;

      toast.success(
        action === "add"
          ? `تمت إضافة ${points} نقطة للمستخدم بنجاح`
          : `تم خصم ${points} نقطة من المستخدم بنجاح`
      );

      setPoints("");
      setReason("");
      setSelectedUser(null);
      setSearchResults([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Error calculating points:", error);
      toast.error("فشل في تحديث النقاط");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background" dir="rtl">
          <AppSidebar />
          <div className="flex-1 order-2">
            <header className="sticky top-0 z-10 bg-background border-b">
              <div className="container mx-auto px-4 py-3 flex items-center gap-3">
                <SidebarTrigger className="-ml-2" />
                <h1 className="text-2xl font-bold">احتساب النقاط</h1>
              </div>
            </header>
            <main className="container mx-auto p-6 space-y-6">
              <Skeleton className="h-64 w-full" />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir="rtl">
        <AppSidebar />
        <div className="flex-1 order-2">
          <header className="sticky top-0 z-10 bg-background border-b">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <SidebarTrigger className="-ml-2" />
              <Calculator className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">احتساب النقاط</h1>
            </div>
          </header>
          <main className="container mx-auto p-6 space-y-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle>إضافة أو خصم نقاط</CardTitle>
                <CardDescription>
                  ابحث عن المستخدم وقم بإضافة أو خصم نقاط من حسابه
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Section */}
                <div className="space-y-2">
                  <Label>البحث عن مستخدم</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="ابحث باسم المستخدم..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                    <Button onClick={handleSearch} size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && !selectedUser && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <Label>نتائج البحث</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchResults([]);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar_url || ""} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                النقاط: {user.total_points.toLocaleString("en-US")} | المستوى: {user.level}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected User */}
                {selectedUser && (
                  <Card className="bg-accent/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={selectedUser.avatar_url || ""} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedUser.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              النقاط الحالية: {selectedUser.total_points.toLocaleString("en-US")}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(null)}
                        >
                          تغيير
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Selection */}
                <div className="space-y-2">
                  <Label>العملية</Label>
                  <Select
                    value={action}
                    onValueChange={(value: "add" | "subtract") => setAction(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-500" />
                          <span>إضافة نقاط</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="subtract">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-500" />
                          <span>خصم نقاط</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Points Input */}
                <div className="space-y-2">
                  <Label>عدد النقاط</Label>
                  <Input
                    type="number"
                    placeholder="أدخل عدد النقاط..."
                    value={points}
                    onChange={(e) => setPoints(e.target.value.replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString()))}
                    min="1"
                  />
                </div>

                {/* Reason Input */}
                <div className="space-y-2">
                  <Label>السبب</Label>
                  <Textarea
                    placeholder="أدخل سبب التغيير..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleCalculatePoints}
                  disabled={!selectedUser || !points || !reason || processing}
                  className="w-full"
                >
                  {processing ? "جاري المعالجة..." : action === "add" ? "إضافة النقاط" : "خصم النقاط"}
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardPointsCalculation;
