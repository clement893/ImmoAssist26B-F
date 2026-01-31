/**
 * Générateur d'Endpoints FastAPI CRUD
 */

const fs = require("fs");
const path = require("path");

function generateEndpoint(name, options = {}) {
  const modelName = name.charAt(0).toUpperCase() + name.slice(1);
  const modelLower = name.toLowerCase();
  const apiPath = options.apiPath || `/api/v1/${modelLower}`;

  const code = `"""
${modelName} Endpoints
Auto-generated FastAPI CRUD endpoints
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.${modelLower} import ${modelName} as ${modelName}Model
from app.schemas.${modelLower} import ${modelName}Create, ${modelName}Update, ${modelName}Response

router = APIRouter()


@router.get("/", response_model=List[${modelName}Response])
async def list_${modelLower}s(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all ${modelLower}s"""
    result = await db.execute(select(${modelName}Model).offset(skip).limit(limit))
    ${modelLower}s = result.scalars().all()
    return [${modelName}Response.model_validate(${modelLower}) for ${modelLower} in ${modelLower}s]


@router.get("/{${modelLower}_id}", response_model=${modelName}Response)
async def get_${modelLower}(
    ${modelLower}_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a ${modelLower} by ID"""
    result = await db.execute(
        select(${modelName}Model).filter(${modelName}Model.id == ${modelLower}_id)
    )
    ${modelLower} = result.scalar_one_or_none()
    if ${modelLower} is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="${modelName} not found"
        )
    return ${modelName}Response.model_validate(${modelLower})


@router.post("/", response_model=${modelName}Response, status_code=status.HTTP_201_CREATED)
async def create_${modelLower}(
    ${modelLower}_in: ${modelName}Create,
    db: AsyncSession = Depends(get_db)
):
    """Create a new ${modelLower}"""
    db_${modelLower} = ${modelName}Model(**${modelLower}_in.model_dump())
    db.add(db_${modelLower})
    await db.commit()
    await db.refresh(db_${modelLower})
    return ${modelName}Response.model_validate(db_${modelLower})


@router.patch("/{${modelLower}_id}", response_model=${modelName}Response)
async def update_${modelLower}(
    ${modelLower}_id: UUID,
    ${modelLower}_in: ${modelName}Update,
    db: AsyncSession = Depends(get_db)
):
    """Update a ${modelLower}"""
    result = await db.execute(
        select(${modelName}Model).filter(${modelName}Model.id == ${modelLower}_id)
    )
    db_${modelLower} = result.scalar_one_or_none()
    if db_${modelLower} is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="${modelName} not found"
        )
    
    update_data = ${modelLower}_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_${modelLower}, key, value)
    
    db.add(db_${modelLower})
    await db.commit()
    await db.refresh(db_${modelLower})
    return ${modelName}Response.model_validate(db_${modelLower})


@router.delete("/{${modelLower}_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_${modelLower}(
    ${modelLower}_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete a ${modelLower}"""
    result = await db.execute(
        select(${modelName}Model).filter(${modelName}Model.id == ${modelLower}_id)
    )
    db_${modelLower} = result.scalar_one_or_none()
    if db_${modelLower} is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="${modelName} not found"
        )
    
    await db.delete(db_${modelLower})
    await db.commit()
    return None
`;

  // Write file
  const endpointDir = path.join(
    __dirname,
    "../../backend/app/api/v1/endpoints",
  );
  const endpointFile = path.join(endpointDir, `${modelLower}.py`);

  if (!fs.existsSync(endpointDir)) {
    fs.mkdirSync(endpointDir, { recursive: true });
  }

  if (fs.existsSync(endpointFile) && !options.force) {
    throw new Error(
      `Le fichier ${endpointFile} existe déjà. Utilisez --force pour l'écraser.`,
    );
  }

  fs.writeFileSync(endpointFile, code);
  console.log(`✅ Endpoints générés: ${endpointFile}`);

  // Update router.py
  const routerFile = path.join(__dirname, "../../backend/app/api/v1/router.py");
  if (fs.existsSync(routerFile)) {
    let routerContent = fs.readFileSync(routerFile, "utf8");

    // Add import if not present
    const importLine = `from app.api.v1.endpoints import ${modelLower}`;
    if (!routerContent.includes(importLine)) {
      // Find the imports section and add after other endpoint imports
      const importMatch = routerContent.match(
        /from app\.api\.v1\.endpoints import .+/,
      );
      if (importMatch) {
        routerContent = routerContent.replace(
          importMatch[0],
          `${importMatch[0]}, ${modelLower}`,
        );
      } else {
        // Add new import section
        routerContent = `from app.api.v1.endpoints import ${modelLower}\n${routerContent}`;
      }
    }

    // Add router include if not present
    const includeLine = `api_router.include_router(${modelLower}.router, prefix="/${modelLower}", tags=["${modelLower}"])`;
    if (!routerContent.includes(includeLine)) {
      // Find the router includes section
      const includeMatch = routerContent.match(
        /api_router\.include_router\(.+\)/,
      );
      if (includeMatch) {
        routerContent = routerContent.replace(
          includeMatch[0],
          `${includeMatch[0]}\n${includeLine}`,
        );
      } else {
        routerContent += `\n${includeLine}\n`;
      }
    }

    fs.writeFileSync(routerFile, routerContent);
    console.log(`✅ Router mis à jour`);
  }
}

module.exports = generateEndpoint;
