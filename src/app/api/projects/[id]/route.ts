import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (!name) return Response.json({ error: "missing name" }, { status: 400 });

  const exists = await db.project.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return Response.json({ error: "not found" }, { status: 404 });

  const duplicate = await db.project.findUnique({ where: { name }, select: { id: true } });
  if (duplicate && duplicate.id !== id) {
    return Response.json({ error: `a project named "${name}" already exists` }, { status: 409 });
  }

  const project = await db.project.update({
    where: { id },
    data: { name },
    select: { id: true, name: true },
  });
  return Response.json(project);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const project = await db.project.findUnique({
    where: { id },
    include: { _count: { select: { documents: true } } },
  });
  if (!project) return Response.json({ error: "not found" }, { status: 404 });
  if (project._count.documents > 0) {
    return Response.json(
      { error: "project still has documents", documents: project._count.documents },
      { status: 409 }
    );
  }
  await db.project.delete({ where: { id } });
  return Response.json({ deleted: true });
}
