import { NextResponse } from "next/server";

import { getAdminModelConfig } from "@/src/admin/config/models";
import { requireAdminApiUser } from "@/src/admin/lib/auth";
import {
  createAdminRecord,
  deleteAdminRecord,
  listAdminRecords,
  updateAdminRecord,
} from "@/src/admin/lib/data";

interface RouteContext {
  params: Promise<{
    model: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const [{ model }, currentUser] = await Promise.all([
      context.params,
      requireAdminApiUser(),
    ]);
    const config = getAdminModelConfig(model);

    if (!config) {
      return NextResponse.json({ error: "Modelo no soportado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const result = await listAdminRecords(config, {
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || config.pageSize || 10,
      search: searchParams.get("search") || "",
      currentOrganizationId: currentUser.currentOrganizationId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error cargando registros" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const [{ model }, currentUser, body] = await Promise.all([
      context.params,
      requireAdminApiUser(),
      request.json(),
    ]);
    const config = getAdminModelConfig(model);

    if (!config) {
      return NextResponse.json({ error: "Modelo no soportado" }, { status: 404 });
    }

    const record = await createAdminRecord(
      config,
      body.data || {},
      currentUser.currentOrganizationId,
      currentUser.currentTimezone?.timezone ?? currentUser.currentOrganization?.defaultTimezone
    );

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creando registro" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const [{ model }, currentUser, body] = await Promise.all([
      context.params,
      requireAdminApiUser(),
      request.json(),
    ]);
    const config = getAdminModelConfig(model);

    if (!config) {
      return NextResponse.json({ error: "Modelo no soportado" }, { status: 404 });
    }

    if (!body.id) {
      return NextResponse.json({ error: "El id es obligatorio" }, { status: 400 });
    }

    const record = await updateAdminRecord(
      config,
      String(body.id),
      body.data || {},
      currentUser.currentOrganizationId,
      currentUser.currentTimezone?.timezone ?? currentUser.currentOrganization?.defaultTimezone
    );

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error actualizando registro" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const [{ model }, body, currentUser] = await Promise.all([
      context.params,
      request.json(),
      requireAdminApiUser(),
    ]);
    const config = getAdminModelConfig(model);

    if (!config) {
      return NextResponse.json({ error: "Modelo no soportado" }, { status: 404 });
    }

    if (!body.id) {
      return NextResponse.json({ error: "El id es obligatorio" }, { status: 400 });
    }

    await deleteAdminRecord(
      config,
      String(body.id),
      currentUser.currentOrganizationId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error eliminando registro" },
      { status: 400 }
    );
  }
}
