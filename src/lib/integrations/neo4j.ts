import neo4j, { type Driver } from "neo4j-driver";
import type { SyncProposalSnapshot } from "@/lib/types";

let driver: Driver | undefined;

function getDriver() {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !username || !password) {
    return null;
  }

  if (!driver) {
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  return driver;
}

export async function syncProposalGraph(snapshot: SyncProposalSnapshot) {
  const neo4jDriver = getDriver();

  if (!neo4jDriver) {
    return;
  }

  const session = neo4jDriver.session();

  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MERGE (company:Company {name: $companyName})
        MERGE (proposal:Proposal {id: $id})
        SET proposal.title = $title,
            proposal.consultationType = $consultationType,
            proposal.status = $status,
            proposal.totalCost = $totalCost,
            proposal.currency = $currency,
            proposal.presentationUrl = $presentationUrl,
            proposal.updatedAt = datetime()
        MERGE (company)-[:HAS_PROPOSAL]->(proposal)
        WITH proposal
        UNWIND $professorNames AS professorName
          MERGE (professor:Professor {name: professorName})
          MERGE (professor)-[:ASSIGNED_TO]->(proposal)
        WITH proposal
        UNWIND $serviceNames AS serviceName
          MERGE (service:Service {name: serviceName})
          MERGE (proposal)-[:INCLUDES_SERVICE]->(service)
        `,
        snapshot
      )
    );
  } catch (error) {
    console.warn("Neo4j sync skipped", error);
  } finally {
    await session.close();
  }
}
