import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  User,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSiteRuntime } from "../platform/runtime/SiteRuntimeContext";

export default function Auth() {
  const { loginWithToken } = useAuth();
  const { runtime } = useSiteRuntime();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("auth");
  const [verificationCode, setVerificationCode] = useState("");
  const [loggedUser, setLoggedUser] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cedula: "",
  });

  const businessName = runtime.identity.businessName || "Tienda";
  const tagline = runtime.brand.tagline || runtime.identity.description || "Accede a tu cuenta para continuar.";
  const logoUrl = runtime.brand.assets.logoUrl;

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setTimeout(() => setResendCooldown((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (step === "auth") {
        const endpoint = isLogin ? "/auth/login" : "/auth/register";
        const payload = isLogin
          ? { email: formData.email, password: formData.password }
          : formData;
        const { data } = await api.post(endpoint, payload);

        if (isLogin) {
          const userToLogin = data.user;
          const tokenToLogin = data.token;
          if (!userToLogin || !tokenToLogin) {
            throw new Error("Respuesta del servidor incompleta");
          }

          loginWithToken(userToLogin, tokenToLogin);
          setLoggedUser(userToLogin);
          setStep("success");
          setTimeout(() => navigate("/"), 1800);
        } else {
          alert(`Registro exitoso. Enviamos un código de verificación a ${formData.email}`);
          setStep("verify");
        }
      } else if (step === "verify") {
        await api.post("/auth/verify", {
          email: formData.email,
          code: verificationCode,
        });
        alert("Email verificado correctamente. Ya puedes iniciar sesión.");
        setStep("auth");
        setIsLogin(true);
        setVerificationCode("");
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Error en la autenticación";
      if (error.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        alert("Debes verificar tu email antes de iniciar sesión.");
        setStep("verify");
      } else if (error.response?.data?.code === "CODE_EXPIRED") {
        alert("El código ha expirado. Solicita uno nuevo.");
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await api.post("/auth/resend-code", { email: formData.email });
      alert("Nuevo código enviado a tu email.");
      setResendCooldown(60);
    } catch (error) {
      alert(error.response?.data?.message || "Error al reenviar código");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="storefront-container flex min-h-[70vh] items-center justify-center py-16">
        <div className="storefront-elevated w-full max-w-xl p-8 text-center sm:p-12" role="status" aria-live="polite">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 size={25} strokeWidth={1.7} />
          </span>
          <p className="storefront-kicker mt-6">Sesión iniciada</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[var(--store-text-primary)] sm:text-4xl">
            Hola, {loggedUser?.name?.split(" ")[0] || "bienvenido"}
          </h1>
          <p className="mt-3 text-sm text-[var(--store-text-muted)]">Volviendo a {businessName}…</p>
          <div className="mx-auto mt-7 h-1 w-24 overflow-hidden rounded-full bg-[var(--store-surface)]">
            <div className="h-full w-full origin-left animate-pulse rounded-full bg-[var(--store-brand)]" />
          </div>
        </div>
      </div>
    );
  }

  const title = step === "verify"
    ? "Verifica tu correo"
    : isLogin
      ? "Inicia sesión"
      : "Crea tu cuenta";

  const description = step === "verify"
    ? `Ingresa el código enviado a ${formData.email}.`
    : isLogin
      ? "Accede a tu cuenta para continuar con tus compras y pedidos."
      : "Crea una cuenta para guardar tus datos y continuar con tus pedidos.";

  return (
    <div className="storefront-container py-10 sm:py-16 lg:py-20">
      <div className="grid min-h-[620px] overflow-hidden rounded-[var(--store-radius-lg)] border border-[var(--store-border)] bg-[var(--store-page-bg)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden border-r border-[var(--store-border)] bg-[var(--store-surface)] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-11 w-11 rounded-xl object-contain" />
              ) : (
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--store-brand)] text-sm font-bold text-[var(--store-brand-contrast)]">
                  {businessName.charAt(0).toUpperCase() || "T"}
                </span>
              )}
              <span className="text-lg font-semibold tracking-[-0.035em] text-[var(--store-text-primary)]">{businessName}</span>
            </Link>

            <div className="mt-20 max-w-lg">
              <p className="storefront-kicker">Cuenta</p>
              <h2 className="storefront-section-title mt-4">{businessName}</h2>
              <p className="storefront-copy mt-5">{tagline}</p>
            </div>
          </div>

          <p className="text-xs leading-5 text-[var(--store-text-muted)]">
            Tus credenciales se usan para acceder a tu cuenta y gestionar tus pedidos en esta tienda.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                {logoUrl ? <img src={logoUrl} alt="" className="h-9 w-9 rounded-xl object-contain" /> : null}
                <span className="font-semibold tracking-[-0.03em] text-[var(--store-text-primary)]">{businessName}</span>
              </Link>
            </div>

            <div className="mb-8">
              <p className="storefront-kicker">{step === "verify" ? "Verificación" : "Acceso"}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[var(--store-text-primary)]">{title}</h1>
              <p className="mt-3 text-sm leading-6 text-[var(--store-text-muted)]">{description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {step === "auth" ? (
                <>
                  {!isLogin ? (
                    <>
                      <AuthInput
                        icon={<User size={16} />}
                        placeholder="Nombre completo"
                        value={formData.name}
                        onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                        required
                      />
                      <AuthInput
                        icon={<User size={16} />}
                        placeholder="Cédula"
                        value={formData.cedula}
                        onChange={(event) => setFormData({ ...formData, cedula: event.target.value })}
                        required
                      />
                    </>
                  ) : null}

                  <AuthInput
                    icon={<Mail size={16} />}
                    placeholder="Correo electrónico"
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    required
                  />
                  <AuthInput
                    icon={<Lock size={16} />}
                    placeholder="Contraseña"
                    type="password"
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    required
                  />
                  {!isLogin ? (
                    <p className="px-1 text-xs leading-5 text-[var(--store-text-muted)]">
                      Usa mínimo 8 caracteres con mayúsculas, minúsculas y números.
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="space-y-3">
                  <AuthInput
                    icon={<KeyRound size={16} />}
                    placeholder="Código de 6 dígitos"
                    inputMode="numeric"
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || loading}
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 text-xs font-semibold text-[var(--store-text-muted)] transition-colors hover:text-[var(--store-text-primary)] disabled:opacity-50"
                  >
                    <RefreshCw size={13} />
                    {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar código"}
                  </button>
                </div>
              )}

              <button type="submit" disabled={loading} className="storefront-brand-button !mt-5 w-full disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    {step === "verify" ? "Verificar" : isLogin ? "Entrar" : "Registrarme"}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 border-t border-[var(--store-border)] pt-6 text-center">
              {step === "auth" ? (
                <button type="button" onClick={() => setIsLogin((current) => !current)} className="text-xs font-semibold text-[var(--store-text-muted)] hover:text-[var(--store-text-primary)]">
                  {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                </button>
              ) : (
                <button type="button" onClick={() => { setStep("auth"); setVerificationCode(""); }} className="text-xs font-semibold text-[var(--store-text-muted)] hover:text-[var(--store-text-primary)]">
                  Volver al inicio
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AuthInput({ icon, ...props }) {
  return (
    <label className="storefront-surface flex min-h-12 items-center gap-3 bg-[var(--store-surface)] px-4 transition-colors focus-within:border-[var(--store-brand)]">
      <span className="shrink-0 text-[var(--store-text-muted)]">{icon}</span>
      <input
        {...props}
        className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[var(--store-text-primary)] outline-none placeholder:text-[var(--store-text-muted)]"
      />
    </label>
  );
}
