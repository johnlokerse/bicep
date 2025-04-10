// Managed DevOps Pool
resource /*${1:managedDevOpsPools}*/managedDevOpsPools 'Microsoft.DevOpsInfrastructure/pools@2025-01-21' = {
  name: /*${2:'name'}*/'name'
  location: /*${3:location}*/'location'
  properties: {
    agentProfile: {
      kind: /*${4|'Stateless','Stateful'|}*/'Stateless'
    }
    devCenterProjectResourceId: /*${5:'devCenterProjectResourceId'}*/'devCenterProjectResourceId'
    fabricProfile: {
      kind: 'Vmss'
      sku: {
        name: /*${6:'skuName'}*/'skuName'
      }
      images: [
        {
          wellKnownImageName: /*${7:'wellKnownImageName'}*/'wellKnownImageName'
        }
      ]
    }
    maximumConcurrency: /*${8:'maximumConcurrency'}*/'maximumConcurrency'
    organizationProfile: {
      kind: 'AzureDevOps'
      organizations: [
        {
          url: /*${9:'organizationUrl'}*/'organizationUrl'
        }
      ]
    }
  }
}
