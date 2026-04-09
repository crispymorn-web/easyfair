from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from app.core.security import get_current_user_id
from app.core.database import get_supabase
from app.services.excel_service import generate_excel

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/{quote_id}/xlsx")
async def export_xlsx(
    quote_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """견적서 Excel 다운로드"""
    sb = get_supabase()
    res = (
        sb.table("quotes")
        .select("*, quote_items(*)")
        .eq("id", quote_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="견적을 찾을 수 없습니다.")

    quote = res.data
    items = quote.pop("quote_items", [])

    xlsx_bytes = generate_excel(quote=quote, items=items)

    filename = f"easyfair_{quote.get('client_name','quote')}_{quote.get('event_name','')}.xlsx"
    filename = filename.replace(" ", "_").replace("/", "-")

    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
