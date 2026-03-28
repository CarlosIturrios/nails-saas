import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-6 text-slate-950 sm:px-6 lg:px-8 xl:px-10 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <section className="w-full rounded-[32px] border border-[#e8dece] bg-white/92 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur sm:p-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)] lg:items-center">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Error 404
              </p>
              <h1 className="mt-3 font-poppins text-3xl font-semibold text-slate-950 sm:text-4xl">
                Esta pagina no existe
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                La ruta que intentaste abrir ya no existe, cambio de lugar o nunca estuvo disponible
                para esta sesion.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Ir al inicio
                </Link>
                
              </div>
            </div>

            <aside className="rounded-[28px] border border-[#e8dece] bg-[#fffdf9] p-5 sm:p-6">
              <div className="inline-flex rounded-full border border-[#ddd1bf] bg-[#fffaf2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                GICA
              </div>

              <div className="mt-5 rounded-[24px] border border-dashed border-[#d8ccbb] bg-[#f8f6f2] p-5 text-center">
                <p className="font-poppins text-6xl font-semibold text-slate-950">404</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Vuelve al inicio para seguir con captura, pendientes, agenda o administracion.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-[#e8dece] bg-white px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">¿Que pudo pasar?</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Un enlace viejo, una ruta escrita manualmente o una pagina que cambio de lugar.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
