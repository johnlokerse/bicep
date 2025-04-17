// $1 = managedDevOpsPools
// $2 = 'name'
// $3 = location
// $4 = 'Stateless'
// $5 = 'devCenterProjectResourceId'
// $6 = 'skuName'
// $7 = 'wellKnownImageName'
// $8 = 1
// $9 = 'organizationUrl'

param location string

resource managedDevOpsPools 'Microsoft.DevOpsInfrastructure/pools@2025-01-21' = {
  name: 'name'
  location: location
  properties: {
    agentProfile: {
      kind: 'Stateless'
    }
    devCenterProjectResourceId: 'devCenterProjectResourceId'
    fabricProfile: {
      kind: 'Vmss'
      sku: {
        name: 'skuName'
      }
      images: [
        {
          wellKnownImageName: 'wellKnownImageName'
        }
      ]
    }
    maximumConcurrency: 1
    organizationProfile: {
      kind: 'AzureDevOps'
      organizations: [
        {
          url: 'organizationUrl'
        }
      ]
    }
  }
}
