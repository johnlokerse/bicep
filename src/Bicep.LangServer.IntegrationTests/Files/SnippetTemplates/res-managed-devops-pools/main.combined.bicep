// $1 = managedDevOpsPools
// $2 = 'name'
// $3 = location
// $4 = 'Stateless'
// $5 = 'devCenterProjectResourceId'
// $6 = 'Standard_DS2_v2'
// $7 = 'windows-2022/latest'
// $8 = 1
// $9 = 'https://dev.azure.com/organization'

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
        name: 'Standard_DS2_v2'
      }
      images: [
        {
          wellKnownImageName: 'windows-2022/latest'
        }
      ]
    }
    maximumConcurrency: 1
    organizationProfile: {
      kind: 'AzureDevOps'
      organizations: [
        {
          url: 'https://dev.azure.com/organization'
        }
      ]
    }
  }
}
