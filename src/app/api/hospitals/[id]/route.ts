import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import { mapHospital } from "@/lib/mapHospital";

/**
 * GET /api/hospitals/[id]
 *
 * Path param: id — the hospitalId (e.g. "HOSP-001")
 *
 * Returns: { hospital: Hospital }
 * Returns 404 if not found.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("hospitals")
    .select("*")
    .eq("hospital_id", id)
    .single();

  if (error) {
    // Supabase returns a PGRST116 error code when no rows are found with .single()
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Hospital not found", hospitalId: id },
        { status: 404 }
      );
    }
    console.error(`[GET /api/hospitals/${id}] Supabase error:`, error.message);
    return NextResponse.json(
      { error: "Failed to fetch hospital", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ hospital: mapHospital(data) });
}

/**
 * PATCH /api/hospitals/[id]
 *
 * Body: { reviewStatus: 'pending' | 'approved' | 'rejected' }
 * Updates the review_status of the hospital.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { reviewStatus, verificationStatus } = body;
    const updateData: any = {};

    if (reviewStatus) {
      if (!['pending', 'approved', 'rejected'].includes(reviewStatus)) {
        return NextResponse.json({ error: "Invalid reviewStatus" }, { status: 400 });
      }
      updateData.review_status = reviewStatus;
    }

    if (verificationStatus) {
      if (!['pending', 'verified', 'simulated'].includes(verificationStatus)) {
        return NextResponse.json({ error: "Invalid verificationStatus" }, { status: 400 });
      }
      updateData.verification_status = verificationStatus;
    }

    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("hospitals")
      .update(updateData)
      .eq("hospital_id", id)
      .select("*")
      .single();

    if (error) {
      console.error(`[PATCH /api/hospitals/${id}] Supabase error:`, error.message);
      return NextResponse.json({ error: "Failed to update hospital", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ hospital: mapHospital(data) });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

/**
 * DELETE /api/hospitals/[id]
 *
 * Deletes the hospital.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { error } = await supabaseAdmin
      .from("hospitals")
      .delete()
      .eq("hospital_id", id);

    if (error) {
      console.error(`[DELETE /api/hospitals/${id}] Supabase error:`, error.message);
      return NextResponse.json({ error: "Failed to delete hospital", detail: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete hospital" }, { status: 500 });
  }
}
