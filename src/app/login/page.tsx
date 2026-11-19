import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { Mark } from "@/components/icons";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log in or sign up" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSessionUser();
  if (session) redirect(sp.next || "/");

  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/";

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid overflow-hidden border-[1.5px] border-ink lg:grid-cols-[1.05fr_1fr]">
        {/* brand plate */}
        <div className="imgframe relative min-h-[290px] border-b-[1.5px] border-ink lg:min-h-[560px] lg:border-b-0 lg:border-r-[1.5px]">
          <img
            src="/images/plan-desk.jpg"
            alt="Site plan and survey documents on a drafting table"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,17,13,0.62)] via-[rgba(20,17,13,0.22)] to-[rgba(20,17,13,0.8)]" />
          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Mark className="h-11 w-11 text-white" filled />
              <span className="font-display text-[26px] font-black tracking-[-0.05em] text-white">
                WAREHUB
              </span>
            </div>
            <div>
              <p className="mono text-[10.5px] uppercase tracking-[0.18em] text-white/80">
                Commercial land &amp; warehouses · since 2019
              </p>
              <p className="mt-3 max-w-[16ch] font-display text-[clamp(34px,6vw,62px)] font-black leading-[0.94] tracking-[-0.045em] text-white">
                Every lot has a{" "}
                <span className="font-serif font-normal italic">paper trail.</span>
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Title checked", "Owner verified", "No brokerage"].map((t) => (
                  <span
                    key={t}
                    className="mono border border-white/60 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* sheet */}
        <div className="bg-card">
          <div className="border-b-[1.5px] border-ink px-5 py-3.5 sm:px-8">
            <span className="cap">Account sheet</span>
          </div>
          <div className="py-5 sm:px-3 sm:py-7">
            <AuthCard next={next} />
          </div>
        </div>
      </div>

      <p className="mono mt-5 text-center text-[11.5px] leading-relaxed text-mute">
        Demo credentials — seller <strong>9822012345 / demo123</strong> · admin{" "}
        <strong>9999999999 / admin123</strong>
      </p>
    </div>
  );
}
