import { useLoaderData, Link } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getQRCode, deleteQRCode } from "../models/QRCode.server";
import {
  Button,
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  Divider,
  InlineStack
} from "@shopify/polaris";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const id = parseFloat(params.id as string);

  const qrCode = await getQRCode(id, admin.graphql);

  if (!qrCode) {
    return redirect("/app");
  }

  return json({ qrCode });
}

export async function action({ request, params }: ActionFunctionArgs) {
  // const { admin } = await authenticate.admin(request);
  const id = parseFloat(params.id as string);

  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "delete") {
    await deleteQRCode(id);
    return redirect("/app");
  }

  return null;
}

export default function QRCodeDetails() {
  const { qrCode } = useLoaderData<typeof loader>();

  return (
    <Page>
      <BlockStack gap="500">
        <InlineStack align="space-between">
          <Text variant="headingLg" as="h2">QR Code Details</Text>
          <Button url={`/app/qrcodes/${qrCode.id}/edit`} variant="primary">Edit</Button>
          <Button url={`/app`} variant="secondary">Back to List</Button>
        </InlineStack>

        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">QR Code</Text>
                  <img
                    src={qrCode.image}
                    alt={`QR Code for ${qrCode.title}`}
                    width={300}
                  />
                  <Link to={qrCode.destinationUrl} target="_blank">View destination</Link>
                </BlockStack>

                <Divider />

                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">Scan Statistics</Text>
                  <Text as="p" variant="bodyLg">{qrCode.scans} total scans</Text>
                </BlockStack>

                <Divider />

                <BlockStack gap="200">
                  <InlineStack align="center" gap="300">
                    <Button variant="plain" onClick={() => {
                      if (confirm("Are you sure you want to delete this QR code?")) {
                        const form = document.createElement("form");
                        form.method = "POST";
                        const input = document.createElement("input");
                        input.type = "hidden";
                        input.name = "action";
                        input.value = "delete";
                        form.appendChild(input);
                        document.body.appendChild(form);
                        form.submit();
                        document.body.removeChild(form);
                      }
                    }}>
                      Delete QR code
                    </Button>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">Title</Text>
                  <Text as="p" variant="bodyMd">{qrCode.title}</Text>
                </BlockStack>

                <Divider />

                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">Product</Text>
                  {qrCode.productDeleted ? (
                    <InlineStack gap="300">
                      {/*<Icon source={DiamondAlertMajor} />*/}
                      <Text as="p" variant="bodyMd" >
                        Product has been deleted
                      </Text>
                    </InlineStack>
                  ) : (
                    <InlineStack gap="300">
                      {qrCode.productImage ? (
                        <img
                          src={qrCode.productImage}
                          alt={qrCode.productAlt || ""}
                          width={60}
                          height={60}
                        />
                      ) : (
                        <Text as="h2">test</Text>
                      )}
                      <Text as="p" variant="bodyMd">{qrCode.productTitle}</Text>
                    </InlineStack>
                  )}
                </BlockStack>

                <Divider />

                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">Destination</Text>
                  <Text as="p" variant="bodyMd">
                    {qrCode.destination === "product"
                      ? "Product page"
                      : "Checkout with product in cart"}
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
