# Webportal Helm chart

Requires Helm 3, Kubernetes 1.19+, and access to a container registry.
Persistent storage is enabled by default and requires a default StorageClass,
an explicitly configured StorageClass, or an existing writable PVC.

## Build and deploy

Run from the `webportal` directory, replacing the registry and tag with your own:

```powershell
docker build -t registry.example.com/battery-passport-portal:1.0.0 .
docker push registry.example.com/battery-passport-portal:1.0.0
helm upgrade --install webportal .\helm --namespace webportal --create-namespace --set image.repository=registry.example.com/battery-passport-portal --set image.tag=1.0.0 --wait
```

The chart does not build the image. All cluster nodes must be able to pull it.
For a private registry, create an image pull secret in the release namespace
and configure `imagePullSecrets: [{name: registry-credentials}]` in a values file.
Use `-f .\my-values.yaml` to supply overrides.

## Access

The default service is internal (ClusterIP), exposing port 80 to container port 80.
For the release name above:

```powershell
kubectl --namespace webportal port-forward service/webportal-webportal 8080:80
```

Open `http://localhost:8080`. To expose it externally, set `service.type=LoadBalancer`
or enable Ingress in a values file:

```yaml
ingress:
  enabled: true
  className: nginx
  hosts:
    - host: portal.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: portal-tls
      hosts:
        - portal.example.com
```

Ingress requires an installed ingress controller, matching DNS, and the specified
TLS secret in the release namespace. Serve the portal at `/` to preserve asset,
API, and deep-link paths.

## Storage and upgrades

Manufacturer registrations are stored in `/app/data`. The chart creates a 1Gi
ReadWriteOnce PVC by default. Configure `persistence.storageClass`,
`persistence.size`, or `persistence.existingClaim` as needed. An existing claim
must be in the release namespace. Set `persistence.storageClass` to `"-"` to
disable dynamic provisioning when using a manually provisioned volume.

The deployment uses one replica and the Recreate strategy because the application
writes registrations to a JSON file rather than a multi-writer database. Upgrades
have a brief interruption; do not scale this deployment horizontally.

The generated PVC is retained on uninstall to avoid deleting registrations.
Back it up and remove it manually when no longer needed. When reinstalling,
set `persistence.existingClaim` to the retained claim's name to reuse it.
Setting `persistence.enabled=false` uses an emptyDir instead; registrations are
then lost when the pod is replaced.

`resources`, `nodeSelector`, `affinity`, and `tolerations` are configurable in
`values.yaml`. Startup, readiness, and liveness probes check HTTP `/`.

The portal currently uses demo authentication; deploying the chart does not add
production authentication or authorization. Restrict access appropriately.
