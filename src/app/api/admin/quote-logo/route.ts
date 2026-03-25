import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { requireAdminApiUser } from "@/src/admin/lib/auth";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "-").toLowerCase();
}

export async function POST(request: Request) {
  try {
    await requireAdminApiUser();

    const publicBlobToken = process.env.BLOB_PUBLIC_READ_WRITE_TOKEN;

    if (!publicBlobToken) {
      return NextResponse.json(
        {
          error:
            "Falta configurar BLOB_PUBLIC_READ_WRITE_TOKEN para subir logos en Vercel Blob.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const organizationId = String(formData.get("organizationId") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Selecciona una imagen antes de subirla" },
        { status: 400 }
      );
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "La organización es obligatoria" },
        { status: 400 }
      );
    }

    const blob = await put(
      `logos/${organizationId}/${Date.now()}-${sanitizeFileName(file.name)}`,
      file,
      {
        access: "public",
        addRandomSuffix: true,
        token: publicBlobToken,
      }
    );

    return NextResponse.json({
      ok: true,
      url: blob.url,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error subiendo el logo",
      },
      { status: 400 }
    );
  }
}
