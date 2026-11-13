// Índice interno de pacotes do sandbox. `pip install` não acessa a internet:
// ele habilita um stub didático que é montado no Pyodide a cada execução.

interface PacotePip {
  versao: string;
  arquivos: Record<string, string>;
}

const GEOPY_GEOCODERS = `
from geopy.exc import GeocoderQuotaExceeded

class Location:
    def __init__(self, address, latitude, longitude):
        self.address = address
        self.latitude = latitude
        self.longitude = longitude

    def __repr__(self):
        return f"Location({self.address}, ({self.latitude}, {self.longitude}))"

# Base offline do sandbox dev_OS (substitui o serviço real do OpenStreetMap).
_BASE = {
    "avenida paulista, 1000, sao paulo": (-23.5647, -46.6527),
    "praca da se, sao paulo": (-23.5503, -46.6339),
    "avenida atlantica, 1702, rio de janeiro": (-22.9671, -43.1779),
    "rua da aurora, 100, recife": (-8.0606, -34.8811),
}

class Nominatim:
    def __init__(self, user_agent=None, timeout=1):
        if not user_agent:
            raise ValueError("Nominatim exige um user_agent identificando a sua aplicação.")
        self.user_agent = user_agent

    def geocode(self, query):
        chave = str(query).strip().lower()
        if "limite" in chave:
            raise GeocoderQuotaExceeded("OVER_QUERY_LIMIT")
        if chave in _BASE:
            lat, lon = _BASE[chave]
            return Location(query, lat, lon)
        return None
`;

export const PACOTES_PIP: Record<string, PacotePip> = {
  geopy: {
    versao: '2.4.1',
    arquivos: {
      'geopy/__init__.py': '__version__ = "2.4.1"\n',
      'geopy/exc.py':
        'class GeopyError(Exception):\n    pass\n\nclass GeocoderServiceError(GeopyError):\n    pass\n\nclass GeocoderQuotaExceeded(GeocoderServiceError):\n    pass\n',
      'geopy/geocoders.py': GEOPY_GEOCODERS,
    },
  },
  pyserial: {
    versao: '3.5',
    arquivos: {
      'serial/__init__.py':
        'class SerialException(Exception):\n    pass\n\nclass Serial:\n    """Porta serial simulada: ecoa o que foi escrito."""\n    def __init__(self, port=None, baudrate=9600, timeout=None):\n        self.port, self.baudrate, self.timeout = port, baudrate, timeout\n        self._buffer = b""\n        self.is_open = True\n    def write(self, dados):\n        self._buffer += dados\n        return len(dados)\n    def readline(self):\n        dados, self._buffer = self._buffer, b""\n        return dados\n    def close(self):\n        self.is_open = False\n',
    },
  },
};

export function pacotesInstalados(pip: string[]): Record<string, string> {
  return Object.assign({}, ...pip.map((p) => PACOTES_PIP[p]?.arquivos ?? {}));
}

/** Versões fictícias estáveis para o `npm install` simulado. */
export const VERSOES_NPM: Record<string, string> = {
  typescript: '5.9.3',
  react: '19.2.0',
  'react-dom': '19.2.0',
  next: '16.0.1',
  tailwindcss: '4.1.16',
  express: '5.1.0',
  axios: '1.13.1',
  zod: '4.1.12',
  '@types/node': '24.9.2',
  '@types/react': '19.2.2',
};

export const IMAGENS_PUBLICAS = ['mysql', 'postgres', 'mongo', 'python', 'node', 'nginx', 'redis', 'eclipse-temurin', 'openjdk', 'alpine', 'ubuntu'];
