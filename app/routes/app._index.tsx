import { useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getQRCodes } from "../models/QRCode.server";
import {Button, Card, EmptyState, IndexTable, InlineStack, Layout, Page, BlockStack, Thumbnail} from "@shopify/polaris";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  const qrCodes = await getQRCodes(session.shop, admin.graphql);

  return json({ qrCodes });
}

export default function Index() {
  const { qrCodes } = useLoaderData<typeof loader>();

  return (
    <Page>
      <BlockStack gap="500">
        <InlineStack align="space-between">
          <Button
            url={"/app/qrcodes/new"}
            variant={"primary"}
          >
            Create new QR code
          </Button>
        </InlineStack>

        <Layout>
          <Layout.Section>
            <Card>
              {qrCodes.length === 0 ? (
                <EmptyState
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{
                    singular: "QR code",
                    plural: "QR codes",
                  }}
                  itemCount={qrCodes.length}
                  headings={[
                    { title: "Thumbnail" },
                    { title: "Title" },
                    { title: "Product" },
                    { title: "Date created" },
                    { title: "Scans" },
                    { title: "Action" },
                  ]}
                  selectable={false}
                >
                  {qrCodes.map((qrCode) => (
                    <IndexTable.Row
                      id={`${qrCode.id}`}
                      key={qrCode.id}
                      position={qrCode.id}
                    >
                      <IndexTable.Cell>
                        <Thumbnail
                          source={qrCode.productImage || ""}
                          alt={qrCode.productAlt || ""}
                        />
                      </IndexTable.Cell>
                      <IndexTable.Cell>{qrCode.title}</IndexTable.Cell>
                      <IndexTable.Cell>
                        {qrCode.productDeleted ? "Deleted product" : qrCode.productTitle}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {new Date(qrCode.createdAt).toDateString()}
                      </IndexTable.Cell>
                      <IndexTable.Cell>{qrCode.scans}</IndexTable.Cell>
                      <IndexTable.Cell>
                        <Button
                          variant={"secondary"}
                          url={`/app/qrcodes/${qrCode.id}`}
                        >
                          View
                        </Button>
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
