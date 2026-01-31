#!/usr/bin/env python3
"""
Générateur de Types TypeScript depuis Schemas Pydantic
Parse les fichiers Pydantic et génère les types TypeScript correspondants
"""

import ast
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Mapping Python -> TypeScript
TYPE_MAPPING = {
    'str': 'string',
    'int': 'number',
    'float': 'number',
    'bool': 'boolean',
    'datetime': 'string',
    'date': 'string',
    'UUID': 'string',
    'dict': 'Record<string, unknown>',
    'Dict': 'Record<string, unknown>',
    'List': 'Array',
    'list': 'Array',
    'Optional': 'null',
    'None': 'null',
    'Any': 'unknown',
}

# Types Pydantic spéciaux
PYDANTIC_TYPES = {
    'EmailStr': 'string',
    'HttpUrl': 'string',
    'constr': 'string',
    'conint': 'number',
    'confloat': 'number',
    'PositiveInt': 'number',
    'PositiveFloat': 'number',
    'NegativeInt': 'number',
    'NegativeFloat': 'number',
}


def parse_python_type(type_str: str) -> str:
    """Parse un type Python et le convertit en TypeScript"""
    type_str = type_str.strip()
    
    # Optional[Type] -> Type | null
    if type_str.startswith('Optional['):
        inner = type_str[9:-1]  # Enlève Optional[
        inner_type = parse_python_type(inner)
        return f'{inner_type} | null'
    
    # Union[Type1, Type2] -> Type1 | Type2
    if type_str.startswith('Union['):
        inner = type_str[6:-1]
        types = [parse_python_type(t.strip()) for t in inner.split(',')]
        return ' | '.join(types)
    
    # List[Type] -> Type[]
    if type_str.startswith('List[') or type_str.startswith('list['):
        inner = type_str[5:-1] if type_str.startswith('List[') else type_str[5:-1]
        inner_type = parse_python_type(inner)
        return f'{inner_type}[]'
    
    # Dict[K, V] -> Record<K, V>
    if type_str.startswith('Dict[') or type_str.startswith('dict['):
        inner = type_str[5:-1] if type_str.startswith('Dict[') else type_str[5:-1]
        parts = inner.split(',', 1)
        if len(parts) == 2:
            key_type = parse_python_type(parts[0].strip())
            value_type = parse_python_type(parts[1].strip())
            return f'Record<{key_type}, {value_type}>'
        return 'Record<string, unknown>'
    
    # Type simple
    if type_str in TYPE_MAPPING:
        return TYPE_MAPPING[type_str]
    
    if type_str in PYDANTIC_TYPES:
        return PYDANTIC_TYPES[type_str]
    
    # EmailStr, HttpUrl, etc.
    if type_str.endswith('Str') or type_str.endswith('Url'):
        return 'string'
    
    # Par défaut, retourner le type tel quel (pour les types personnalisés)
    return type_str


def extract_field_type(annotation) -> str:
    """Extrait le type d'une annotation AST"""
    if annotation is None:
        return 'unknown'
    
    # Annotation simple (Name)
    if isinstance(annotation, ast.Name):
        type_name = annotation.id
        if type_name in PYDANTIC_TYPES:
            return PYDANTIC_TYPES[type_name]
        return parse_python_type(type_name)
    
    # Annotation avec module (Attribute) - ex: pydantic.EmailStr, uuid.UUID
    if isinstance(annotation, ast.Attribute):
        attr_name = annotation.attr
        if attr_name == 'UUID':
            return 'string'
        if attr_name in PYDANTIC_TYPES:
            return PYDANTIC_TYPES[attr_name]
        # EmailStr, HttpUrl, etc.
        if attr_name.endswith('Str') or attr_name.endswith('Url'):
            return 'string'
        return parse_python_type(attr_name)
    
    # Subscript (List[T], Optional[T], etc.)
    if isinstance(annotation, ast.Subscript):
        if isinstance(annotation.value, ast.Name):
            if annotation.value.id == 'Optional':
                # Gérer Python 3.10+ avec | None
                if isinstance(annotation.slice, ast.Constant) and annotation.slice.value is None:
                    return 'unknown | null'
                inner = extract_field_type(annotation.slice)
                return f'{inner} | null'
            if annotation.value.id in ('List', 'list'):
                inner = extract_field_type(annotation.slice)
                return f'{inner}[]'
            if annotation.value.id in ('Dict', 'dict'):
                return 'Record<string, unknown>'
        
        # Union
        if isinstance(annotation.value, ast.Name) and annotation.value.id == 'Union':
            if isinstance(annotation.slice, ast.Tuple):
                types = [extract_field_type(el) for el in annotation.slice.elts]
                return ' | '.join(types)
        
        # Python 3.10+ Union syntax: str | None
        if isinstance(annotation.value, ast.Name) and annotation.value.id == 'None':
            return 'null'
        
        # Autres subscripts
        if isinstance(annotation.slice, ast.Name):
            return parse_python_type(annotation.slice.id)
        if isinstance(annotation.slice, ast.Constant):
            return parse_python_type(str(annotation.slice.value))
        
        # Gérer les slices complexes
        if hasattr(annotation.slice, 'value'):
            return extract_field_type(annotation.slice.value)
    
    # Constant
    if isinstance(annotation, ast.Constant):
        return parse_python_type(str(annotation.value))
    
    # BinOp pour Python 3.10+ (str | None)
    if isinstance(annotation, ast.BinOp):
        if isinstance(annotation.op, ast.BitOr):
            left = extract_field_type(annotation.left)
            right = extract_field_type(annotation.right)
            return f'{left} | {right}'
    
    return 'unknown'


def parse_pydantic_schema(file_path: Path) -> Dict[str, Dict[str, str]]:
    """Parse un fichier Pydantic et extrait les schemas"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    try:
        tree = ast.parse(content)
    except SyntaxError as e:
        print(f"⚠️  Erreur de syntaxe dans {file_path}: {e}", file=sys.stderr)
        return {}
    
    schemas = {}
    class_bases = {}  # Pour gérer l'héritage
    
    # Première passe: identifier toutes les classes et leurs bases
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            bases = []
            for base in node.bases:
                if isinstance(base, ast.Name):
                    bases.append(base.id)
                elif isinstance(base, ast.Attribute):
                    bases.append(base.attr)
            class_bases[node.name] = bases
    
    # Deuxième passe: extraire les schemas
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            # Vérifier si c'est un schema Pydantic (hérite de BaseModel directement ou indirectement)
            is_pydantic = False
            bases = class_bases.get(node.name, [])
            
            # Vérifier directement
            if 'BaseModel' in bases:
                is_pydantic = True
            else:
                # Vérifier l'héritage indirect
                for base in bases:
                    if base in class_bases and 'BaseModel' in class_bases[base]:
                        is_pydantic = True
                        break
            
            if not is_pydantic:
                continue
            
            schema_name = node.name
            fields = {}
            
            # Hériter les champs de la classe de base si elle existe
            for base_name in bases:
                if base_name in schemas:
                    fields.update(schemas[base_name])
            
            # Extraire les champs de la classe
            for item in node.body:
                if isinstance(item, ast.AnnAssign) and isinstance(item.target, ast.Name):
                    field_name = item.target.id
                    field_type = extract_field_type(item.annotation)
                    
                    # Vérifier si le champ a une valeur par défaut
                    is_optional = False
                    if item.value:
                        if isinstance(item.value, ast.Constant) and item.value.value is None:
                            is_optional = True
                        elif isinstance(item.value, ast.NameConstant) and item.value.value is None:
                            is_optional = True
                        elif isinstance(item.value, ast.Call):
                            # Field() avec default=None
                            if isinstance(item.value.func, ast.Name) and item.value.func.id == 'Field':
                                for keyword in item.value.keywords:
                                    if keyword.arg == 'default' and (
                                        (isinstance(keyword.value, ast.Constant) and keyword.value.value is None) or
                                        (isinstance(keyword.value, ast.NameConstant) and keyword.value.value is None)
                                    ):
                                        is_optional = True
                                        break
                    
                    if is_optional and not field_type.endswith('| null'):
                        field_type = f'{field_type} | null'
                    
                    fields[field_name] = field_type
            
            if fields:
                schemas[schema_name] = fields
    
    return schemas


def generate_typescript_interface(name: str, fields: Dict[str, str], base_name: Optional[str] = None) -> str:
    """Génère une interface TypeScript"""
    interface_name = name if not base_name else name.replace(base_name, '').replace('Create', '').replace('Update', '').replace('Response', '')
    if not interface_name:
        interface_name = base_name or name
    
    lines = [f"export interface {interface_name} {{"]
    
    for field_name, field_type in fields.items():
        # Ne pas inclure les champs spéciaux Pydantic
        if field_name.startswith('_'):
            continue
        lines.append(f"  {field_name}: {field_type};")
    
    lines.append("}")
    
    return "\n".join(lines)


def generate_typescript_file(schemas_dir: Path, output_file: Path):
    """Génère le fichier TypeScript avec tous les types"""
    all_schemas = {}
    
    # Parcourir tous les fichiers Python dans le répertoire schemas
    for schema_file in schemas_dir.glob("*.py"):
        if schema_file.name == "__init__.py":
            continue
        
        print(f"📄 Parsing {schema_file.name}...")
        file_schemas = parse_pydantic_schema(schema_file)
        all_schemas.update(file_schemas)
    
    if not all_schemas:
        print("⚠️  Aucun schema trouvé")
        return
    
    # Grouper les schemas par base name (UserCreate, UserUpdate, UserResponse -> User)
    grouped_schemas: Dict[str, Dict[str, Dict[str, str]]] = {}
    
    for schema_name, fields in all_schemas.items():
        # Extraire le nom de base
        base_name = schema_name
        for suffix in ['Create', 'Update', 'Response']:
            if schema_name.endswith(suffix):
                base_name = schema_name[:-len(suffix)]
                break
        
        if base_name not in grouped_schemas:
            grouped_schemas[base_name] = {}
        
        grouped_schemas[base_name][schema_name] = fields
    
    # Générer le contenu TypeScript
    content = [
        "/**",
        " * Auto-generated TypeScript types from Pydantic schemas",
        " * DO NOT EDIT MANUALLY - This file is auto-generated",
        " * Run: npm run generate:types",
        " */",
        "",
    ]
    
    # Générer les interfaces principales
    for base_name, schemas in sorted(grouped_schemas.items()):
        # Trouver le schema Response ou le plus complet
        main_schema = None
        if f"{base_name}Response" in schemas:
            main_schema = schemas[f"{base_name}Response"]
        elif base_name in schemas:
            main_schema = schemas[base_name]
        elif schemas:
            main_schema = list(schemas.values())[0]
        
        if main_schema:
            content.append(generate_typescript_interface(base_name, main_schema))
            content.append("")
        
        # Générer Create et Update si ils existent
        if f"{base_name}Create" in schemas:
            content.append(generate_typescript_interface(f"{base_name}Create", schemas[f"{base_name}Create"], base_name))
            content.append("")
        
        if f"{base_name}Update" in schemas:
            content.append(generate_typescript_interface(f"{base_name}Update", schemas[f"{base_name}Update"], base_name))
            content.append("")
    
    # Écrire le fichier
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(content))
    
    print(f"✅ Types générés: {output_file}")
    print(f"   {len(grouped_schemas)} modèle(s) trouvé(s)")


def main():
    """Point d'entrée principal"""
    # Déterminer les chemins
    script_dir = Path(__file__).parent.parent.parent
    backend_dir = script_dir / "backend"
    schemas_dir = backend_dir / "app" / "schemas"
    output_dir = script_dir / "packages" / "types" / "src"
    output_file = output_dir / "generated.ts"
    
    if not schemas_dir.exists():
        print(f"❌ Répertoire schemas introuvable: {schemas_dir}")
        sys.exit(1)
    
    print("🔄 Génération des types TypeScript depuis Pydantic...")
    print(f"   Source: {schemas_dir}")
    print(f"   Destination: {output_file}")
    print()
    
    generate_typescript_file(schemas_dir, output_file)
    
    # Mettre à jour index.ts
    index_file = output_dir / "index.ts"
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "export * from './generated'" not in content:
            with open(index_file, 'a', encoding='utf-8') as f:
                f.write("\nexport * from './generated';\n")
            print("✅ index.ts mis à jour")
    else:
        # Créer index.ts s'il n'existe pas
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write("export * from './generated';\n")
        print("✅ index.ts créé")
    
    print("\n✅ Génération terminée!")


if __name__ == "__main__":
    main()

