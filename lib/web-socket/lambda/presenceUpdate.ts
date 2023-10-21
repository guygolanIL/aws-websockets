import { APIGatewayProxyResultV2, APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { queries } from "./queries";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { notify } from "./util/notify";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (e): Promise<APIGatewayProxyResultV2> => {
    console.log('PresenceUpdate event', e);

    const q = queries(new DynamoDBClient());
    const usersConnections = await q.fetchOtherConnections(e.requestContext.connectionId);

    const body = JSON.parse(e.body || "{}") as { data: { location?: number } };

    await notify(usersConnections, {
        event: "user_presence_updated",
        data: {
            location: body.data.location || 0,
        },
    }, {
        onError(connectionId, error) {
            console.log(error);
            q.deleteConnection(connectionId);
        },
    });

    return { statusCode: 200 };
}; 