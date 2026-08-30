import type { RefObject } from "react";

import type { Favorite } from "@/app/auction/types";
import { useDialogFocus } from "@/app/auction/use-dialog-focus";

type FavoritesDialogProps = {
    favorites: Favorite[];
    onSelect: (favorite: Favorite) => void;
    onRemove: (index: number) => void;
    onClose: () => void;
    triggerRef?: RefObject<HTMLElement | null>;
};

/**
 * Provides controls for adding a favorite and viewing saved favorites.
 *
 * @param addButtonText - The label displayed on the add button
 * @param onAdd - Called when the add button is clicked
 * @param onShow - Called when the favorites button is clicked
 */
export function FavoriteToolbar({
    addButtonText,
    onAdd,
    onShow,
    showButtonRef,
}: {
    addButtonText: string;
    onAdd: () => void;
    onShow: () => void;
    showButtonRef?: RefObject<HTMLButtonElement | null>;
}) {
    return (
        <div className="flex gap-2">
            <button
                className="btn btn-outline w-auto min-w-[50px]"
                onClick={onAdd}
            >
                {addButtonText}
            </button>
            <button
                ref={showButtonRef}
                className="btn btn-outline w-auto  min-w-[50px]"
                onClick={onShow}
            >
                즐겨찾기 보기
            </button>
        </div>
    );
}

/**
 * Renders the saved favorites and provides actions to select or remove each entry.
 *
 * @param favorites - The favorites to display.
 * @param onSelect - Called with a favorite when it is selected.
 * @param onRemove - Called with the index of a favorite when it is removed.
 */
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

/**
 * Renders a modal dialog containing the saved favorites and a close action.
 *
 * @param props - Favorite data and callbacks for selecting, removing, and closing the dialog
 */
export function FavoritesDialog(props: FavoritesDialogProps) {
    const dialogRef = useDialogFocus(props.onClose, props.triggerRef);
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="favorites-dialog-title"
                tabIndex={-1}
                className="bg-white border p-4 rounded-lg shadow-lg w-80 outline-none"
            >
                <h2
                    id="favorites-dialog-title"
                    className="text-lg font-bold mb-2"
                >
                    즐겨찾기 목록
                </h2>
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
