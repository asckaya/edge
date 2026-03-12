import worker from "./index";
import YAML from "yaml";
import fs from "fs";
import { buildProxyUri } from "./src/utils/proxy-builder";
import { AnyProxySchema } from "./src/types";

async function test() {
    const yamlContent = fs.readFileSync("proxy.yaml", "utf-8");
    const parsedYaml = YAML.parse(yamlContent);
    const secret = parsedYaml?.secret || "";
    const providers = parsedYaml?.provider || [];
    
    let proxies = [];
    if (parsedYaml?.proxy && Array.isArray(parsedYaml.proxy)) {
        proxies = parsedYaml.proxy.map((p) => AnyProxySchema.parse(p));
    }

    const params = new URLSearchParams();
    if (secret) params.set("secret", secret);
    for (const p of providers) {
        if (p.name && p.url) params.set(p.name, p.url);
    }
    const proxyUris = proxies.flatMap(p => buildProxyUri(p)).filter(Boolean);
    if (proxyUris.length > 0) params.set("proxies", proxyUris.join("\n"));

    const req = new Request("http://localhost/?" + params.toString());
    const res = await worker.fetch(req, {}, {});
    const content = await res.text();

    fs.writeFileSync("mihomo-test.yaml", content);
    console.log("YAML generated to mihomo-test.yaml");
}

test();
