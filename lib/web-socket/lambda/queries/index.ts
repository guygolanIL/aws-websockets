import { DeleteItemCommand, DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

export function queries(client: DynamoDBClient) {

    return {
        async fetchOtherConnections(myConnectionId: string) {
            const connectionItems = await client.send(
                new ScanCommand({
                    TableName: process.env.PRESENCE_TABLE,
                    FilterExpression: 'attribute_not_exists(SK) or SK <> :skValue',
                    ExpressionAttributeValues: {
                        ':skValue': { S: myConnectionId },
                    }
                }),
            );

            return connectionItems.Items?.map(item => item.SK.S).filter((item): item is string => Boolean(item)) || [];
        },
        async fetchConnections() {
            const connectionItems = await client.send(
                new ScanCommand({
                    TableName: process.env.PRESENCE_TABLE,
                }),
            );

            return connectionItems.Items?.map(item => item.SK.S).filter((item): item is string => Boolean(item)) || [];
        },
        async deleteConnection(connectionId: string) {
            await client.send(
                new DeleteItemCommand({
                    TableName: process.env.PRESENCE_TABLE,
                    Key: {
                        PK: { S: "presence" },
                        SK: { S: connectionId },
                    },
                })
            );
        }
    };
}