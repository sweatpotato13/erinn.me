import type { Favorite } from "@/app/auction/types";

type FavoritesDialogProps = {
    favorites: Favorite[];
    onSelect: (favorite: Favorite) => void;
    onRemove: (index: number) => void;
    onClose: () => void;
};

export function FavoriteToolbar({
    addButtonText,
    onAdd,
    onShow,
}: {
    addButtonText: string;
    onAdd: () => void;
    onShow: () => void;
}) {
    return (
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full mb-2">
            <button
                className="btn btn-outline w-auto min-w-[50px]"
                onClick={onAdd}
            >
                {addButtonText}
            </button>
            <button
                className="btn btn-outline w-auto  min-w-[50px]"
                onClick={onShow}
            >
                즐겨찾기 보기
            </button>
        </div>
    );
}

function FavoriteList({ favorites, onSelect, onRemove }: FavoritesDialogProps) {
    if (favorites.length === 0) return <div>저장된 즐겨찾기가 없습니다.</div>;
    return (
        <ul className="list-disc ml-4">
            {favorites.map((favorite, index) => (
                <li
                    key={`favorite-${favorite.itemName}-${favorite.category}-${index}`}
                    className="flex justify-between items-center"
                >
                    <button
                        className="underline"
                        onClick={() => onSelect(favorite)}
                    >
                        {favorite.itemName} ({favorite.category})
                    </button>
                    <button
                        className="text-red-500 ml-4"
                        onClick={() => onRemove(index)}
                    >
                        삭제
                    </button>
                </li>
            ))}
        </ul>
    );
}

export function FavoritesDialog(props: FavoritesDialogProps) {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white border p-4 rounded-lg shadow-lg w-80">
                <h2 className="text-lg font-bold mb-2">즐겨찾기 목록</h2>
                <FavoriteList {...props} />
                <button
                    className="btn btn-outline mt-4 w-full"
                    onClick={props.onClose}
                >
                    닫기
                </button>
            </div>
        </div>
    );
}
