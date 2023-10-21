import { Construct } from "constructs";
import * as cdk from 'aws-cdk-lib';
import { join } from 'path';
import { ISource } from "aws-cdk-lib/aws-s3-deployment";

export class FrontEndDeploy extends Construct {
  constructor(scope: Construct, id: string, source: ISource) {
    super(scope, id);

    const staticSiteBucket = new cdk.aws_s3.Bucket(scope, 'StaticSiteBucket', {
      websiteIndexDocument: 'index.html',
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      publicReadAccess: true,
    });

    // Deploy the built code of packages/frontend
    // to the bucket automatically on every code change
    new cdk.aws_s3_deployment.BucketDeployment(scope, 'DeployStaticSite', {
      sources: [source],
      destinationBucket: staticSiteBucket,
    });

    // Create a CloudFront distribution to serve the website
    new cdk.aws_cloudfront.Distribution(scope, 'StaticSiteDistribution', {
      defaultBehavior: {
        origin: new cdk.aws_cloudfront_origins.S3Origin(staticSiteBucket),
        viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });
  }
}
