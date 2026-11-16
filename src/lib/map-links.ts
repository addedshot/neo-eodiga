// 카카오맵 링크(키 없이 쓰는 주소 형식). 이름에 쉼표가 있으면 주소가 깨져서 빈칸으로 바꾼다.
export function kakaoMapLinks(name: string, lat: number, lng: number) {
  const label = encodeURIComponent(name.replace(/,/g, " "));
  return {
    map: `https://map.kakao.com/link/map/${label},${lat},${lng}`,
    route: `https://map.kakao.com/link/to/${label},${lat},${lng}`,
  };
}
