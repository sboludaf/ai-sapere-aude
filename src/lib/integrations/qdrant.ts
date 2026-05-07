import { QdrantClient } from "@qdrant/js-client-rest";
import type { SyncProposalSnapshot } from "@/lib/types";

let client: QdrantClient | undefined;

function getQdrantClient() {
  const url = process.env.QDRANT_URL;

  if (!url) {
    return null;
  }

  if (!client) {
    client = new QdrantClient({
      url,
      apiKey: process.env.QDRANT_API_KEY || undefined
    });
  }

  return client;
}

function deterministicVector(text: string, size: number) {
  const vector = new Array<number>(size).fill(0);

  for (let index = 0; index < text.length; index += 1) {
    const charCode = text.charCodeAt(index);
    const slot = index % size;
    vector[slot] += ((charCode % 97) / 97) * (index % 2 === 0 ? 1 : -1);
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / magnitude).toFixed(6)));
}

async function ensureCollection(qdrant: QdrantClient, collectionName: string, vectorSize: number) {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((collection) => collection.name === collectionName);

  if (exists) {
    return;
  }

  await qdrant.createCollection(collectionName, {
    vectors: {
      size: vectorSize,
      distance: "Cosine"
    }
  });
}

export async function syncProposalVector(snapshot: SyncProposalSnapshot) {
  const qdrant = getQdrantClient();

  if (!qdrant) {
    return;
  }

  const collectionName = process.env.QDRANT_COLLECTION ?? "proposal_vectors";
  const vectorSize = Number(process.env.QDRANT_VECTOR_SIZE ?? 128);
  const text = [
    snapshot.title,
    snapshot.companyName,
    snapshot.consultationType,
    snapshot.status,
    snapshot.serviceNames.join(" "),
    snapshot.professorNames.join(" ")
  ].join(" | ");

  try {
    await ensureCollection(qdrant, collectionName, vectorSize);
    await qdrant.upsert(collectionName, {
      points: [
        {
          id: snapshot.id,
          vector: deterministicVector(text, vectorSize),
          payload: {
            proposalId: snapshot.id,
            title: snapshot.title,
            companyName: snapshot.companyName,
            consultationType: snapshot.consultationType,
            status: snapshot.status,
            totalCost: snapshot.totalCost,
            currency: snapshot.currency,
            presentationUrl: snapshot.presentationUrl,
            serviceNames: snapshot.serviceNames,
            professorNames: snapshot.professorNames
          }
        }
      ]
    });
  } catch (error) {
    console.warn("Qdrant sync skipped", error);
  }
}
