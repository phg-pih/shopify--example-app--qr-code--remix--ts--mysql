import { useLoaderData, useActionData } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import type {QRCode, QRCodeValidationErrors} from "../models/QRCode.server";
import { validateQRCode, createQRCode } from "../models/QRCode.server";
import { QRCodeForm } from "../components/QRCodeForm";

export async function loader({ request }: LoaderFunctionArgs) {
  // const { admin, session } = await authenticate.admin(request);
  const { admin } = await authenticate.admin(request);

  // Fetch products from Shopify
  const response = await admin.graphql(`
    query {
      products(first: 25) {
        nodes {
          id
          title
          images(first: 1) {
            nodes {
              url
            }
          }
          variants(first: 1) {
            nodes {
              id
            }
          }
        }
      }
    }
  `);

  const {
    data: {
      products: { nodes: products },
    },
  } = await response.json();

  return json({ products });
}

export async function action({ request, params }: ActionFunctionArgs) {
  // const { session, admin } = await authenticate.admin(request);
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const title = formData.get("title") as string;
  const productId = formData.get("productId") as string;
  const destination = formData.get("destination") as string;
  const productHandle = formData.get("productHandle") as string;
  const productVariantId = formData.get("productVariantId") as string;

  const data = {
    title,
    productId,
    destination,
    productHandle,
    productVariantId,
  };

  const errors = validateQRCode(data as Partial<QRCode>);

  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const qrCodeId = await createQRCode({
    ...data,
    shop: session.shop,
    scans: 0,
  } as Partial<QRCode>);

  return redirect(`/app/qrcodes/${qrCodeId}`);
}

export default function NewQRCode() {
  const { products } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ errors: QRCodeValidationErrors }>();

  return (
    <QRCodeForm
      formErrors={actionData?.errors}
      action="/app/qrcodes/new"
      products={products}
    />
  );
}
