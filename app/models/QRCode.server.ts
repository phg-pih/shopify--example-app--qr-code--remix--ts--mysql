import qrcode from "qrcode";
import invariant from "tiny-invariant";
import db from "../db.server";

// Define interfaces for the QRCode data structure
export interface QRCode {
  id: number;
  shop: string;
  destination: "product" | "cart";
  productId: string;
  productHandle: string;
  productVariantId: string;
  title: string;
  scans: number;
  createdAt: Date;
}

// Extended QRCode with supplemental data
export interface SupplementedQRCode extends QRCode {
  productDeleted: boolean;
  productTitle: string | null;
  productImage: string | null;
  productAlt: string | null;
  destinationUrl: string;
  image: string;
}

// GraphQL response interface
interface ProductGraphQLResponse {
  data: {
    product: {
      title: string;
      images: {
        nodes: Array<{
          altText: string | null;
          url: string;
        }>;
      };
    } | null;
  };
}

// Type for graphql function
type GraphQLFunction = (
  query: string,
  options: { variables: Record<string, any> }
) => Promise<Response>;

// Type for validation errors
export interface QRCodeValidationErrors {
  title?: string;
  productId?: string;
  destination?: string;
  [key: string]: string | undefined;
}

export async function getQRCode(id: number, graphql: GraphQLFunction): Promise<SupplementedQRCode | null> {
  const qrCode = await db.qRCode.findFirst({ where: { id } });

  if (!qrCode) {
    return null;
  }

  return supplementQRCode(qrCode as QRCode, graphql);
}

export async function getQRCodes(shop: string, graphql: GraphQLFunction): Promise<SupplementedQRCode[]> {
  const qrCodes = await db.qRCode.findMany({
    where: { shop },
    orderBy: { id: "desc" },
  });

  if (qrCodes.length === 0) return [];

  return Promise.all(
    qrCodes.map((qrCode) => supplementQRCode(qrCode as QRCode, graphql))
  );
}

export function getQRCodeImage(id: number): Promise<string> {
  const url = new URL(`/qrcodes/${id}/scan`, process.env.SHOPIFY_APP_URL as string);
  return qrcode.toDataURL(url.href);
}

export function getDestinationUrl(qrCode: QRCode): string {
  if (qrCode.destination === "product") {
    return `https://${qrCode.shop}/products/${qrCode.productHandle}`;
  }

  const match = /gid:\/\/shopify\/ProductVariant\/([0-9]+)/.exec(qrCode.productVariantId);
  invariant(match, "Unrecognized product variant ID");

  return `https://${qrCode.shop}/cart/${match[1]}:1`;
}

async function supplementQRCode(qrCode: QRCode, graphql: GraphQLFunction): Promise<SupplementedQRCode> {
  const qrCodeImagePromise = getQRCodeImage(qrCode.id);

  const response = await graphql(
      `
      query supplementQRCode($id: ID!) {
        product(id: $id) {
          title
          images(first: 1) {
            nodes {
              altText
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        id: qrCode.productId,
      },
    }
  );

  const {
    data: { product },
  } = await response.json() as ProductGraphQLResponse;

  return {
    ...qrCode,
    productDeleted: !product?.title,
    productTitle: product?.title || null,
    productImage: product?.images?.nodes[0]?.url || null,
    productAlt: product?.images?.nodes[0]?.altText || null,
    destinationUrl: getDestinationUrl(qrCode),
    image: await qrCodeImagePromise,
  };
}

export function validateQRCode(data: Partial<QRCode>): QRCodeValidationErrors | undefined {
  const errors: QRCodeValidationErrors = {};

  if (!data.title) {
    errors.title = "Title is required";
  }

  if (!data.productId) {
    errors.productId = "Product is required";
  }

  if (!data.destination) {
    errors.destination = "Destination is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }

  return undefined;
}

export async function createQRCode(data: Partial<QRCode>): Promise<number> {
  const qrCode = await db.qRCode.create({
    data: {
      ...data,
    } as any, // Type casting due to partial data
  });

  return qrCode.id;
}

export async function updateQRCode(id: number, data: Partial<QRCode>): Promise<void> {
  await db.qRCode.update({
    where: { id },
    data: {
      ...data,
    },
  });
}

export async function deleteQRCode(id: number): Promise<void> {
  await db.qRCode.delete({
    where: { id },
  });
}
