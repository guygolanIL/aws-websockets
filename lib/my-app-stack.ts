import * as cdk from 'aws-cdk-lib';
import { type Construct } from 'constructs';
import { WebSocketBackend } from './web-socket';
import { FrontEndDeploy } from './front-end';
import { join } from 'path';

export class MyAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const webSocketBackend = new WebSocketBackend(this, 'ws-backend');
    const frontEndDeploy = new FrontEndDeploy(
      this,
      'app',
      cdk.aws_s3_deployment.Source.asset(join(__dirname, 'front-end', 'app', 'dist'))
    );
  }
}
