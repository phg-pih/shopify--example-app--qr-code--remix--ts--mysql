import { redirect } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";
import db from "../db.server";
import { getDestinationUrl } from "../models/QRCode.server";
import type {QRCode} from "../models/QRCode.server";

export async function loader({ params }: LoaderFunctionArgs) {
  invariant(params.id, "Could not find QR code destination");

  const id = Number(params.id);

  const qrCode = await db.qRCode.findFirst({ where: { id } });

  invariant(qrCode, "Could not find QR code destination");

  await db.qRCode.update({
    where: { id },
    data: { scans: { increment: 1 } },
  });

  return redirect(getDestinationUrl(qrCode as QRCode));
}
